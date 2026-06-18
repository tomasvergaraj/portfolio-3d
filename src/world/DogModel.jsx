import React, { useRef, useEffect, useLayoutEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────
// Mascota 3D real (glb con esqueleto y animación de caminar). Con `null` el
// Player usa el perro de primitivas. El Player mueve y orienta el grupo que lo
// contiene (estela + rumbo); aquí solo reproducimos el ciclo de marcha y lo
// aceleramos/frenamos según cuánto se desplaza el perro.
export const DOG_MODEL_URL = '/dog_walk.glb' // null para volver a las primitivas

// Escala alta porque el Armature del glb trae un scale interno de 0.01; este
// valor se afinó sobre el render (el bbox del skinned mesh no es fiable). El
// origen del modelo coincide con sus patas, así que no necesita lift.
const SCALE = 320
const FEET_LIFT = 0
// El grupo orienta el hocico hacia +x (la marcha resta π/2 al rumbo). Giramos
// para que la frente del modelo coincida con ese eje.
const FACE_OFFSET = Math.PI / 2

// Velocidad base del avatar (de Player). Sirve para normalizar el desplazamiento
// del perro a un timeScale ~1 a paso normal.
const BASE_SPEED = 6.4

const _wp = new THREE.Vector3()

function tune(root) {
  root.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) {
      o.castShadow = true
      o.receiveShadow = false
      o.frustumCulled = false
    }
  })
}

export function DogModel() {
  const group = useRef()
  // Una sola instancia: usamos la escena directa (clonar un skinned mesh rompe
  // el binding del esqueleto si no se usa SkeletonUtils).
  const { scene, animations } = useGLTF(DOG_MODEL_URL)
  const { actions } = useAnimations(animations, group)
  const action = useRef(null)
  const last = useRef(new THREE.Vector3())
  const inited = useRef(false)

  useLayoutEffect(() => tune(scene), [scene])

  useEffect(() => {
    const a = Object.values(actions)[0]
    if (!a) return
    a.reset().play()
    a.setLoop(THREE.LoopRepeat, Infinity)
    action.current = a
    return () => a.stop()
  }, [actions])

  useFrame((_, dt) => {
    const a = action.current
    const g = group.current
    if (!a || !g) return
    g.getWorldPosition(_wp)
    if (!inited.current) {
      last.current.copy(_wp)
      inited.current = true
    }
    const step = _wp.distanceTo(last.current)
    last.current.copy(_wp)
    // Desplazamiento por segundo del perro → velocidad de la animación. En
    // reposo se detiene (timeScale 0) para no "patinar" en el sitio.
    const speed = step / Math.max(dt, 1e-3)
    const ts = THREE.MathUtils.clamp(speed / BASE_SPEED, 0, 2.2)
    a.setEffectiveTimeScale(ts < 0.06 ? 0 : ts)
  })

  return (
    <group ref={group} scale={SCALE} position={[0, FEET_LIFT, 0]} rotation={[0, FACE_OFFSET, 0]}>
      <primitive object={scene} />
    </group>
  )
}

if (DOG_MODEL_URL) useGLTF.preload(DOG_MODEL_URL)
