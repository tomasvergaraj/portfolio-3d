import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { readInput } from '../controls/input'
import { playerMotion } from './playerState'

// ─────────────────────────────────────────────────────────────────────────
// Avatar 3D real (Mixamo). Se sirve como GLB (meshopt) para que el deploy cargue
// rápido. Los FBX originales (~45 MB) se convierten con el pipeline local (los
// FBX deben estar en public/ y el dev server arriba):
//   1) node scripts/extract-fbx-textures.mjs character/character_inactive.fbx
//        → tmp/Image_0.jpg (difuso) y tmp/Image_1.jpg (normal); FBXLoader NO
//          extrae las texturas embebidas, hay que sacarlas a mano.
//   2) node scripts/fbx-to-glb.mjs            → tmp/*.raw.glb (en el navegador)
//   3) node scripts/optimize-avatar.mjs tmp/avatar.raw.glb public/avatar.glb 1024 \
//        flipv --diffuse=tmp/Image_0.jpg --normal=tmp/Image_1.jpg
//      (flipv corrige el convenio de UV FBX↔glTF; sin él la textura sale a manchas)
//   4) optimize-avatar de walk/run con 'anim' (solo huesos + clip).
// avatar.glb trae malla + esqueleto + clip de reposo; avatar_walk/run.glb traen
// SOLO el clip (huesos sin malla), que se reaplica al esqueleto por nombre.
export const AVATAR_MODEL_URL = '/avatar.glb' // malla + esqueleto + clip de reposo
export const AVATAR_WALK_URL = '/avatar_walk.glb' // solo clip de caminar (in place)
export const AVATAR_RUN_URL = '/avatar_run.glb' // solo clip de correr (in place)
export const AVATAR_JUMP_URL = '/avatar_jump.glb' // solo clip de salto (one-shot)

// El GLB conserva la misma jerarquía y unidades del FBX de Mixamo (GLTFExporter
// no rehornea las transformaciones), así que la escala es la misma que usábamos
// con useFBX. Ajustado sobre el render.
const SCALE = 0.0105
// Apoyo en el suelo: este rig tiene el pivote a la altura de la cadera (los pies
// quedan ~0.55 bajo el origen ya escalado) y el grupo del avatar está ~0.2 bajo
// la tapa de pasto. Subimos para que los pies toquen el suelo.
const FOOT_Y = 0.4
// Velocidad base del avatar (SPEED en Player). Normaliza la velocidad de la
// animación de caminar.
const BASE_SPEED = 6.4
// Velocidad del avatar al hacer sprint (SPEED * SPRINT_MULT en Player). Normaliza
// la animación de correr.
const SPRINT_SPEED = 6.4 * 1.85
// Los clips de Mixamo son tranquilos; a la velocidad real del avatar hay que
// acelerarlos para que no patinen. Multiplicadores del timeScale.
const WALK_ANIM_MULT = 1.6
const RUN_ANIM_MULT = 1.1
const JUMP_ANIM_MULT = 1.0
// El salto lo MANEJA la animación: su root motion (caderas) sube y baja al avatar
// y flexiona las piernas como fue diseñado (los pies se quedan apoyados en el
// aterrizaje, sin hundirse). Solo recortamos la espera inicial y la cola de reposo
// para que sea ágil, y amplificamos el tramo de SUBIDA del root motion para que el
// salto tenga más altura (el aterrizaje queda intacto → no se hunde).
const JUMP_CLIP_START = 0.2 // s: recorta la espera quieta, deja la anticipación
const JUMP_CLIP_END = 1.1 // s: hasta terminar la recepción; corta la cola de reposo
const JUMP_CLIP_FPS = 30 // Mixamo
const JUMP_LEAP_GAIN = 3.4 // amplifica la altura del salto (solo subida)

function tuneMaterials(model) {
  model.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) {
      o.castShadow = true
      o.receiveShadow = false
      o.frustumCulled = false
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        if (!m) continue
        m.roughness = 0.85
        m.metalness = 0
        m.side = THREE.FrontSide
      }
    }
  })
}

const _wp = new THREE.Vector3()

// Amplifica SOLO el tramo de subida del root motion (caderas) de un clip: aleja de
// la altura de pie las posiciones que están por ENCIMA de ella, dejando intactas
// las de la bajada/aterrizaje. Así el salto gana altura sin tocar la recepción, que
// mantiene los pies apoyados (la flexión de piernas la da el propio clip).
function amplifyLeap(clip, gain) {
  for (const track of clip.tracks) {
    if (!track.name.endsWith('.position')) continue
    const v = track.values // [x,y,z, x,y,z, …]
    const stand = v[1] // Y de pie (primer fotograma)
    for (let i = 1; i < v.length; i += 3) {
      const d = v[i] - stand
      if (d > 0) v[i] = stand + d * gain
    }
  }
}

function GlbAvatar() {
  const ref = useRef()
  // Una sola instancia: usamos la escena directa (sin clonar el skinned mesh,
  // que clone(true) rompería el binding del esqueleto).
  const gltf = useGLTF(AVATAR_MODEL_URL) // malla + esqueleto + clip de reposo
  const walkGlb = AVATAR_WALK_URL ? useGLTF(AVATAR_WALK_URL) : null // solo su clip
  const runGlb = AVATAR_RUN_URL ? useGLTF(AVATAR_RUN_URL) : null // solo su clip
  const jumpGlb = AVATAR_JUMP_URL ? useGLTF(AVATAR_JUMP_URL) : null // solo su clip
  const scene = gltf.scene

  // Combina el clip de reposo (del modelo) con los de caminar, correr y saltar
  // (de los otros GLB), todos aplicados al esqueleto del modelo por nombre.
  const clips = useMemo(() => {
    const out = []
    const idle = gltf.animations?.[0]
    if (idle) { idle.name = 'idle'; out.push(idle) }
    const walk = walkGlb?.animations?.[0]
    if (walk) { walk.name = 'walk'; out.push(walk) }
    const run = runGlb?.animations?.[0]
    if (run) { run.name = 'run'; out.push(run) }
    const jumpSrc = jumpGlb?.animations?.[0]
    if (jumpSrc) {
      // Recorta la espera inicial y la cola de reposo (subclip usa nº de fotograma
      // = tiempo·fps), conservando anticipación→salto→aire→aterrizaje con flexión.
      const jump = THREE.AnimationUtils.subclip(
        jumpSrc, 'jump',
        Math.round(JUMP_CLIP_START * JUMP_CLIP_FPS),
        Math.round(JUMP_CLIP_END * JUMP_CLIP_FPS),
        JUMP_CLIP_FPS
      )
      amplifyLeap(jump, JUMP_LEAP_GAIN) // más altura, sin tocar la recepción
      out.push(jump)
    }
    return out
  }, [gltf, walkGlb, runGlb, jumpGlb])

  const { actions, mixer } = useAnimations(clips, ref)
  const last = useRef(new THREE.Vector3())
  const inited = useRef(false)
  const lastJumpId = useRef(0) // último salto disparado
  const jumpActive = useRef(false) // clip de salto en curso (hasta que termina)

  useLayoutEffect(() => tuneMaterials(scene), [scene])

  useEffect(() => {
    // Los clics cíclicos (idle/walk/run) reproducen siempre; el peso decide cuál
    // se ve. El salto es one-shot: queda preparado en peso 0 y se dispara aparte.
    for (const name of ['idle', 'walk', 'run']) {
      const a = actions[name]
      if (a) a.reset().play().setEffectiveWeight(name === 'idle' ? 1 : 0)
    }
    const jump = actions.jump
    if (jump) {
      jump.setLoop(THREE.LoopOnce, 1)
      jump.clampWhenFinished = true
      jump.setEffectiveTimeScale(JUMP_ANIM_MULT)
      jump.setEffectiveWeight(0)
    }
    // El salto es one-shot: al terminar el clip soltamos su peso (vuelve idle/walk).
    const onFinished = (e) => {
      if (e.action === actions.jump) jumpActive.current = false
    }
    mixer?.addEventListener('finished', onFinished)
    return () => {
      for (const name of ['idle', 'walk', 'run']) actions[name]?.stop()
      actions.jump?.stop()
      mixer?.removeEventListener('finished', onFinished)
    }
  }, [actions, mixer])

  useFrame((_, dt) => {
    const { idle, walk, run, jump } = actions
    const g = ref.current
    if (!g) return
    g.getWorldPosition(_wp)
    if (!inited.current) {
      last.current.copy(_wp)
      inited.current = true
    }
    // Solo el desplazamiento horizontal cuenta como "moverse": así el salto (que
    // mueve al avatar en Y) no enciende por error la animación de caminar.
    const dx = _wp.x - last.current.x
    const dz = _wp.z - last.current.z
    last.current.copy(_wp)
    const speed = Math.hypot(dx, dz) / Math.max(dt, 1e-3)

    if (!walk) return

    // Salto: cuando el Player anuncia un nuevo jumpId, reproducimos el clip una vez.
    // La animación maneja todo (sube/baja al avatar y flexiona las piernas); sigue
    // activa hasta que termina (evento 'finished').
    if (jump && playerMotion.jumpId !== lastJumpId.current) {
      lastJumpId.current = playerMotion.jumpId
      jumpActive.current = true
      jump.reset().setEffectiveTimeScale(JUMP_ANIM_MULT).setEffectiveWeight(1).play()
    }
    const jumping = jumpActive.current

    // Clasifica el estado: la velocidad (delta de posición) detecta movimiento
    // de forma robusta al framerate y al congelado (con panel abierto no se
    // mueve → reposo). El sprint viene del input (Shift / joystick a fondo).
    const moving = speed > 0.12
    const sprint = readInput().sprint
    const running = moving && sprint && !!run
    const walking = moving && !running

    // Cross-fade de los pesos hacia su objetivo (suavizado estable a dt). El
    // salto tiene prioridad mientras está en el aire; al aterrizar se suelta
    // rápido (k mayor) para no arrastrar la pose y que camine/corra al instante.
    const k = 1 - Math.pow(0.0001, dt)
    const kJump = 1 - Math.pow(0.0001, dt * 4)
    const lerpW = (a, target, kk = k) => a && a.setEffectiveWeight(THREE.MathUtils.lerp(a.getEffectiveWeight(), target, kk))
    lerpW(jump, jumping ? 1 : 0, jumping ? 1 : kJump)
    lerpW(idle, !moving && !jumping ? 1 : 0)
    lerpW(walk, walking && !jumping ? 1 : 0)
    lerpW(run, running && !jumping ? 1 : 0)

    // Acelera las piernas con la velocidad real para no patinar.
    walk.setEffectiveTimeScale(THREE.MathUtils.clamp((speed / BASE_SPEED) * WALK_ANIM_MULT, 0.8, 3))
    if (run) run.setEffectiveTimeScale(THREE.MathUtils.clamp((speed / SPRINT_SPEED) * RUN_ANIM_MULT, 0.8, 3))
  })

  return (
    <group ref={ref}>
      <primitive object={scene} scale={SCALE} position={[0, FOOT_Y, 0]} />
    </group>
  )
}

export function AvatarModel() {
  return <GlbAvatar />
}

if (AVATAR_MODEL_URL) useGLTF.preload(AVATAR_MODEL_URL)
if (AVATAR_WALK_URL) useGLTF.preload(AVATAR_WALK_URL)
if (AVATAR_RUN_URL) useGLTF.preload(AVATAR_RUN_URL)
if (AVATAR_JUMP_URL) useGLTF.preload(AVATAR_JUMP_URL)
