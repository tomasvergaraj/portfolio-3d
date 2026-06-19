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
// El clip de salto dura ~1.53 s; lo aceleramos un poco para que el despegue
// acompañe a la parábola física (≈0.8 s en el aire) y la recepción caiga en el
// suelo.
const JUMP_ANIM_MULT = 1.5

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
    const jump = jumpGlb?.animations?.[0]
    if (jump) { jump.name = 'jump'; out.push(jump) }
    return out
  }, [gltf, walkGlb, runGlb, jumpGlb])

  const { actions, mixer } = useAnimations(clips, ref)
  const last = useRef(new THREE.Vector3())
  const inited = useRef(false)
  const lastJumpId = useRef(0) // último salto disparado
  const jumpAnim = useRef(false) // animación de salto en curso (hasta que termina)

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
    // Al terminar el clip de salto soltamos su peso para volver a idle/walk/run.
    const onFinished = (e) => {
      if (e.action === actions.jump) jumpAnim.current = false
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

    // Salto: cuando el Player anuncia un nuevo jumpId, reproducimos el clip una
    // vez desde el principio. jumpAnim sigue activo hasta que el clip termina.
    if (jump && playerMotion.jumpId !== lastJumpId.current) {
      lastJumpId.current = playerMotion.jumpId
      jumpAnim.current = true
      jump.reset().setEffectiveTimeScale(JUMP_ANIM_MULT).setEffectiveWeight(1).play()
    }
    const jumping = jumpAnim.current

    // Clasifica el estado: la velocidad (delta de posición) detecta movimiento
    // de forma robusta al framerate y al congelado (con panel abierto no se
    // mueve → reposo). El sprint viene del input (Shift / joystick a fondo).
    const moving = speed > 0.12
    const sprint = readInput().sprint
    const running = moving && sprint && !!run
    const walking = moving && !running

    // Cross-fade de los pesos hacia su objetivo (suavizado estable a dt). El
    // salto tiene prioridad: mientras está activo, silencia idle/walk/run.
    const k = 1 - Math.pow(0.0001, dt)
    const lerpW = (a, target) => a && a.setEffectiveWeight(THREE.MathUtils.lerp(a.getEffectiveWeight(), target, k))
    lerpW(jump, jumping ? 1 : 0)
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
