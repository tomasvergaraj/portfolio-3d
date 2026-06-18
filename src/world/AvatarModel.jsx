import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { useFBX, useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { readInput } from '../controls/input'

// ─────────────────────────────────────────────────────────────────────────
// Avatar 3D real (Mixamo u otro). Para activarlo, deja un modelo válido en
// `public/` y pon su ruta aquí. Soporta:
//   • glTF/GLB  → recomendado (ligero; usa useGLTF)
//   • FBX 7.x   → binario o ASCII (useFBX). OJO: el FBXLoader de three NO
//                 soporta FBX 6100 (versión antigua).
//
// Con `null` el Player usa el avatar de primitivas (sin cargar nada).
export const AVATAR_MODEL_URL = '/character_inactive.fbx' // modelo + clip de reposo
// FBX con SOLO el clip de caminar, "in place" (sin desplazamiento de raíz, que
// si no haría derivar al personaje). Mismo rig de Mixamo. null = solo reposo.
export const AVATAR_WALK_URL = '/character_walk_in_place.fbx'
// FBX con SOLO el clip de correr (in place). Se usa al hacer sprint. null = sin
// correr (se queda en walk al sprintar).
export const AVATAR_RUN_URL = '/character_running.fbx'

// Mixamo exporta en centímetros (~180 u); escalamos a ~1.8 u. Para un .glb en
// metros usa SCALE ≈ 1. Ajustado sobre el render.
const IS_GLTF = !!AVATAR_MODEL_URL && /\.glb|\.gltf$/i.test(AVATAR_MODEL_URL)
const SCALE = IS_GLTF ? 1 : 0.0105
// Apoyo en el suelo: este rig tiene el pivote a la altura de la cadera (los pies
// quedan ~0.55 bajo el origen ya escalado) y el grupo del avatar está ~0.2 bajo
// la tapa de pasto. Subimos para que los pies toquen el suelo.
const FOOT_Y = 0.58
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

function GltfAvatar() {
  const { scene } = useGLTF(AVATAR_MODEL_URL)
  const model = useMemo(() => scene.clone(true), [scene])
  useLayoutEffect(() => tuneMaterials(model), [model])
  return <primitive object={model} scale={SCALE} position={[0, FOOT_Y, 0]} />
}

const _wp = new THREE.Vector3()

function FbxAvatar() {
  const ref = useRef()
  // Una sola instancia: usamos el objeto directo (sin clonar el skinned mesh).
  const fbx = useFBX(AVATAR_MODEL_URL) // malla + esqueleto + clip de reposo
  const walkFbx = AVATAR_WALK_URL ? useFBX(AVATAR_WALK_URL) : null // solo su clip
  const runFbx = AVATAR_RUN_URL ? useFBX(AVATAR_RUN_URL) : null // solo su clip

  // Combina el clip de reposo (del modelo) con los de caminar y correr (de los
  // otros FBX), todos aplicados al esqueleto del modelo renderizado.
  const clips = useMemo(() => {
    const out = []
    const idle = fbx.animations?.[0]
    if (idle) { idle.name = 'idle'; out.push(idle) }
    const walk = walkFbx?.animations?.[0]
    if (walk) { walk.name = 'walk'; out.push(walk) }
    const run = runFbx?.animations?.[0]
    if (run) { run.name = 'run'; out.push(run) }
    return out
  }, [fbx, walkFbx, runFbx])

  const { actions } = useAnimations(clips, ref)
  const last = useRef(new THREE.Vector3())
  const inited = useRef(false)

  useLayoutEffect(() => tuneMaterials(fbx), [fbx])

  useEffect(() => {
    // Todos los clips reproducen siempre; el peso decide cuál se ve.
    for (const name of ['idle', 'walk', 'run']) {
      const a = actions[name]
      if (a) a.reset().play().setEffectiveWeight(name === 'idle' ? 1 : 0)
    }
    return () => {
      for (const name of ['idle', 'walk', 'run']) actions[name]?.stop()
    }
  }, [actions])

  useFrame((_, dt) => {
    const { idle, walk, run } = actions
    const g = ref.current
    if (!g) return
    g.getWorldPosition(_wp)
    if (!inited.current) {
      last.current.copy(_wp)
      inited.current = true
    }
    const step = _wp.distanceTo(last.current)
    last.current.copy(_wp)
    const speed = step / Math.max(dt, 1e-3)

    if (!walk) return
    // Clasifica el estado: la velocidad (delta de posición) detecta movimiento
    // de forma robusta al framerate y al congelado (con panel abierto no se
    // mueve → reposo). El sprint viene del input (Shift / joystick a fondo).
    const moving = speed > 0.12
    const sprint = readInput().sprint
    const running = moving && sprint && !!run
    const walking = moving && !running

    // Cross-fade de los tres pesos hacia su objetivo (suavizado estable a dt).
    const k = 1 - Math.pow(0.0001, dt)
    const lerpW = (a, target) => a && a.setEffectiveWeight(THREE.MathUtils.lerp(a.getEffectiveWeight(), target, k))
    lerpW(idle, !moving ? 1 : 0)
    lerpW(walk, walking ? 1 : 0)
    lerpW(run, running ? 1 : 0)

    // Acelera las piernas con la velocidad real para no patinar.
    walk.setEffectiveTimeScale(THREE.MathUtils.clamp((speed / BASE_SPEED) * WALK_ANIM_MULT, 0.8, 3))
    if (run) run.setEffectiveTimeScale(THREE.MathUtils.clamp((speed / SPRINT_SPEED) * RUN_ANIM_MULT, 0.8, 3))
  })

  return (
    <group ref={ref}>
      <primitive object={fbx} scale={SCALE} position={[0, FOOT_Y, 0]} />
    </group>
  )
}

export function AvatarModel() {
  return IS_GLTF ? <GltfAvatar /> : <FbxAvatar />
}

if (AVATAR_MODEL_URL) {
  if (IS_GLTF) useGLTF.preload(AVATAR_MODEL_URL)
  else useFBX.preload(AVATAR_MODEL_URL)
}
if (AVATAR_WALK_URL) useFBX.preload(AVATAR_WALK_URL)
if (AVATAR_RUN_URL) useFBX.preload(AVATAR_RUN_URL)
