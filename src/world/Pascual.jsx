import React, { useRef, useEffect, useLayoutEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// "Pascual": un gato que deambula por la isla. Aparece en una posición aleatoria,
// elige destinos al azar y camina hacia ellos; al llegar se queda quieto un rato y
// elige otro. El ciclo de patas del modelo riggeado (export de Unreal) colapsa con
// el skinning de three.js al reproducirse, así que usamos la malla estática y el
// "caminar" lo da un bamboleo procedural que se activa al moverse y se apaga al
// parar — el efecto buscado de caminar/detenerse.
const URL = '/pascual.glb'
const GROUND_Y = 0.72

// El modelo viene centrado en el origen (~1.75 de alto). Lo escalamos a tamaño de
// gato, y LIFT (media altura) apoya los pies en el suelo. Afinados sobre el render.
const SCALE = 0.62
const LIFT = 0.87 // media altura del modelo (centro→base)
const FACE_OFFSET = 0 // giro para alinear el frente del modelo con +z

const WALK_SPEED = 2.1 // u/s
const WANDER_MIN = 4 // radio interior donde elige destinos
const WANDER_MAX = 16 // radio exterior (la isla llega a ~20)
const ARRIVE = 0.6
const TURN = 0.12
const PAUSE_MIN = 1.5
const PAUSE_MAX = 4.5
const BOB_FREQ = 10 // velocidad del bamboleo al caminar
const BOB_AMP = 0.12 // altura del bamboleo (pre-escala)

function lerpAngle(a, b, t) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

export function Pascual() {
  const group = useRef()
  const inner = useRef()
  const { scene } = useGLTF(URL)
  const st = useRef({ mode: 'pause', tx: 0, tz: 0, timer: 1, phase: 0 })

  useLayoutEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = false
        o.frustumCulled = false
      }
    })
  }, [scene])

  const pickTarget = () => {
    const ang = Math.random() * Math.PI * 2
    const r = WANDER_MIN + Math.random() * (WANDER_MAX - WANDER_MIN)
    st.current.tx = Math.cos(ang) * r
    st.current.tz = Math.sin(ang) * r
  }

  useEffect(() => {
    // Aparición en una posición aleatoria del mapa, mirando hacia un lado al azar.
    const ang = Math.random() * Math.PI * 2
    const r = WANDER_MIN + Math.random() * (WANDER_MAX - WANDER_MIN)
    group.current?.position.set(Math.cos(ang) * r, GROUND_Y, Math.sin(ang) * r)
    if (group.current) group.current.rotation.y = Math.random() * Math.PI * 2
    st.current.timer = 0.5 + Math.random() * 1.5 // breve pausa inicial
  }, [])

  useFrame((_, dt) => {
    const g = group.current
    if (!g) return
    const d = Math.min(dt, 0.05)
    const s = st.current
    const inr = inner.current

    if (s.mode === 'pause') {
      // Quieto: baja suavemente el bamboleo (caminar desactivado).
      if (inr) {
        inr.position.y += (0 - inr.position.y) * 0.2
        inr.rotation.x += (0 - inr.rotation.x) * 0.2
      }
      s.timer -= d
      if (s.timer <= 0) {
        pickTarget()
        s.mode = 'walk'
      }
      return
    }

    // Camina hacia el destino.
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
    // Bamboleo procedural = "animación de caminar" activada.
    s.phase += d * BOB_FREQ
    if (inr) {
      inr.position.y = Math.abs(Math.sin(s.phase)) * BOB_AMP
      inr.rotation.x = Math.sin(s.phase * 2) * 0.05
    }
  })

  return (
    <group ref={group} scale={SCALE}>
      <group ref={inner}>
        <primitive object={scene} position={[0, LIFT, 0]} rotation={[0, FACE_OFFSET, 0]} />
      </group>
    </group>
  )
}

useGLTF.preload(URL)
