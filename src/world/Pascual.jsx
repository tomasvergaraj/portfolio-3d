import React, { useRef, useEffect, useMemo, useLayoutEffect } from 'react'
import { useFBX, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// "Pascual": un gato que deambula por la isla con su animación de caminar REAL.
// Aparece en posición aleatoria, elige destinos al azar, camina hacia ellos (clip
// de caminar activo) y al llegar se detiene un rato (clip en fade-out → pose
// neutra), repitiendo. Se carga desde FBX porque el rig de la versión glTF se
// desarmaba al animar; el FBXLoader de three sí lo reproduce bien.
const URL = '/pascual_walk2.fbx'
const GROUND_Y = 0.72
const TARGET_H = 1.1 // alto objetivo del gato (auto-escala desde el bbox)
const FACE_OFFSET = 0 // el modelo ya mira a +z = la dirección de avance (verificado)

const WALK_SPEED = 2.1 // u/s
const ANIM_TS = 1.1 // velocidad del clip de caminar
const WANDER_MIN = 4
const WANDER_MAX = 16
const ARRIVE = 0.6
const TURN = 0.12
const FADE = 0.25
const PAUSE_MIN = 1.5
const PAUSE_MAX = 4.5

function lerpAngle(a, b, t) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

export function Pascual() {
  const group = useRef()
  const fbx = useFBX(URL)
  const { actions } = useAnimations(fbx.animations, group)
  const walk = useRef(null)
  const st = useRef({ mode: 'pause', tx: 0, tz: 0, timer: 1, walking: false })

  // Auto-ajuste: escala a TARGET_H y apoya los pies en el suelo (bbox de bind).
  const { scale, lift } = useMemo(() => {
    fbx.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(fbx)
    const size = new THREE.Vector3()
    box.getSize(size)
    const s = TARGET_H / (size.y || 1)
    return { scale: s, lift: -box.min.y }
  }, [fbx])

  useLayoutEffect(() => {
    fbx.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true
        o.receiveShadow = false
        o.frustumCulled = false
      }
    })
  }, [fbx])

  const pickTarget = () => {
    const ang = Math.random() * Math.PI * 2
    const r = WANDER_MIN + Math.random() * (WANDER_MAX - WANDER_MIN)
    st.current.tx = Math.cos(ang) * r
    st.current.tz = Math.sin(ang) * r
  }

  useEffect(() => {
    const a = Object.values(actions)[0]
    walk.current = a
    a?.setLoop(THREE.LoopRepeat, Infinity)
    // Aparición en posición aleatoria del mapa, mirando hacia un lado al azar.
    const ang = Math.random() * Math.PI * 2
    const r = WANDER_MIN + Math.random() * (WANDER_MAX - WANDER_MIN)
    group.current?.position.set(Math.cos(ang) * r, GROUND_Y, Math.sin(ang) * r)
    if (group.current) group.current.rotation.y = Math.random() * Math.PI * 2
    st.current.timer = 0.5 + Math.random() * 1.5 // breve pausa inicial
    return () => a?.stop()
  }, [actions])

  useFrame((_, dt) => {
    const g = group.current
    const a = walk.current
    if (!g) return
    const d = Math.min(dt, 0.05)
    const s = st.current

    if (s.mode === 'pause') {
      if (a && s.walking) {
        a.fadeOut(FADE)
        s.walking = false
      }
      s.timer -= d
      if (s.timer <= 0) {
        pickTarget()
        s.mode = 'walk'
      }
      return
    }

    const dx = s.tx - g.position.x
    const dz = s.tz - g.position.z
    const dist = Math.hypot(dx, dz)
    if (dist < ARRIVE) {
      s.mode = 'pause'
      s.timer = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN)
      return
    }
    const nx = dx / dist
    const nz = dz / dist
    g.position.x += nx * WALK_SPEED * d
    g.position.z += nz * WALK_SPEED * d
    g.rotation.y = lerpAngle(g.rotation.y, Math.atan2(nx, nz), TURN)
    if (a && !s.walking) {
      a.reset().fadeIn(FADE).play()
      a.setEffectiveTimeScale(ANIM_TS)
      s.walking = true
    }
  })

  return (
    <group ref={group} scale={scale}>
      <primitive object={fbx} position={[0, lift, 0]} rotation={[0, FACE_OFFSET, 0]} />
    </group>
  )
}

useFBX.preload(URL)
