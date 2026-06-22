import React, { useRef, useEffect, useLayoutEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────
// Mascota 3D: "Rover" (el perro asistente de búsqueda de Windows XP), con
// esqueleto y varios clips. A diferencia del modelo anterior —un único clip de
// caminar que se CONGELABA en reposo— este alterna entre Idle (parado, vivo) y
// Travel (caminar), con cross-fade, y acelera el ciclo de marcha según cuánto se
// desplaza. El Player mueve/orienta el grupo contenedor; aquí solo animamos.
export const DOG_MODEL_URL = '/rover.glb' // null para volver a las primitivas

// El modelo mide ~1.45 u de alto con su origen en las patas (y=0). A escala 1
// quedaría casi tan alto como el avatar; lo encogemos a una mascota pequeña.
const SCALE = 0.7
const FEET_LIFT = 0
// El grupo orienta el hocico hacia +x (la marcha del Player resta π/2 al rumbo).
// El cuerpo de Rover es largo en Z, así que lo giramos para alinear su frente.
const FACE_OFFSET = Math.PI / 2

const BASE_SPEED = 6.4 // velocidad base del avatar (normaliza el timeScale a ~1)
const ANIM_SPEED = 1.4 // multiplicador del ciclo de marcha
const MAX_TS = 2.6 // tope del timeScale al correr
const MOVE_EPS = 0.5 // velocidad (u/s) a partir de la cual pasa a Travel
const FADE = 0.25 // segundos de cross-fade entre Idle y Travel

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
  // Una sola instancia: usamos la escena directa (clonar un skinned mesh rompe el
  // binding del esqueleto sin SkeletonUtils).
  const { scene, animations } = useGLTF(DOG_MODEL_URL)
  const { actions } = useAnimations(animations, group)
  const cur = useRef(null)
  const last = useRef(new THREE.Vector3())
  const inited = useRef(false)

  useLayoutEffect(() => tune(scene), [scene])

  // Arranca en Idle; deja ambos clips en bucle.
  useEffect(() => {
    const idle = actions.Idle
    const travel = actions.Travel
    idle?.setLoop(THREE.LoopRepeat, Infinity)
    travel?.setLoop(THREE.LoopRepeat, Infinity)
    if (idle) {
      idle.reset().play()
      cur.current = idle
    }
    return () => Object.values(actions).forEach((a) => a?.stop())
  }, [actions])

  useFrame((_, dt) => {
    const g = group.current
    const idle = actions.Idle
    const travel = actions.Travel
    if (!g || !idle || !travel) return

    g.getWorldPosition(_wp)
    if (!inited.current) {
      last.current.copy(_wp)
      inited.current = true
    }
    const step = _wp.distanceTo(last.current)
    last.current.copy(_wp)
    const speed = step / Math.max(dt, 1e-3)
    const moving = speed > MOVE_EPS

    // Cambia de estado con cross-fade cuando empieza/termina de moverse.
    const want = moving ? travel : idle
    if (cur.current !== want) {
      want.reset().fadeIn(FADE).play()
      cur.current?.fadeOut(FADE)
      cur.current = want
    }
    // Al caminar, el ciclo de marcha sigue la velocidad real (sin patinar).
    if (moving) {
      const ts = THREE.MathUtils.clamp((speed / BASE_SPEED) * ANIM_SPEED, 0.4, MAX_TS)
      travel.setEffectiveTimeScale(ts)
    }
  })

  return (
    <group ref={group} scale={SCALE} position={[0, FEET_LIFT, 0]} rotation={[0, FACE_OFFSET, 0]}>
      <primitive object={scene} />
    </group>
  )
}

if (DOG_MODEL_URL) useGLTF.preload(DOG_MODEL_URL)
