import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { playerPos, playerMotion } from './playerState'
import { sampleHeight } from './terrain'

// Rastro de huellas que el avatar deja al caminar y se desvanecen (idea del folio
// de Bruno Simon, que deja marcas/rodadas en el suelo). Es un pool de manchas
// blandas tendidas en el suelo: cada cierta distancia recorrida se "estampa" una
// nueva en los pies y, con el tiempo, se encoge y se apaga. Se congela con
// prefers-reduced-motion.
const COUNT = 22
const STEP_DIST = 0.8 // distancia entre huellas
const LIFE = 4.5 // segundos hasta desvanecerse
const PRINT_LIFT = 0.03 // apenas sobre el suelo para no hacer z-fighting
const MAX_OPACITY = 0.5
const FOOT_OFFSET = 0.22 // separación lateral izquierda/derecha

function footTexture() {
  // Polvo claro: contrasta tanto sobre el camino de piedra (oscuro) como sobre el
  // pasto, así la huella se lee en cualquier superficie por la que pase el avatar.
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(214,200,172,0.95)')
  grd.addColorStop(0.65, 'rgba(206,190,160,0.45)')
  grd.addColorStop(1, 'rgba(206,190,160,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

export function FootTrail({ reducedMotion = false }) {
  const tex = useMemo(footTexture, [])
  const refs = useRef([])
  const prints = useMemo(
    () => Array.from({ length: COUNT }, () => ({ age: Infinity, x: 0, y: 0, z: 0, rot: 0, scl: 1 })),
    []
  )
  // Estado de emisión: último punto donde estampamos, distancia acumulada,
  // dirección de avance y pie (alterna izquierda/derecha), y siguiente índice.
  const emit = useRef({ lx: null, lz: null, acc: 0, dirx: 0, dirz: 1, foot: 1, next: 0 })

  useFrame((state, dt) => {
    if (reducedMotion) return
    const d = Math.min(dt, 0.05)
    const e = emit.current
    const px = playerPos.x
    const pz = playerPos.z

    if (e.lx === null) {
      e.lx = px
      e.lz = pz
    }
    const mvx = px - e.lx
    const mvz = pz - e.lz
    const moved = Math.hypot(mvx, mvz)
    if (playerMotion.moving && moved > 0.0001) {
      // Dirección de avance suavizada (para orientar la huella y ubicar el pie).
      e.dirx = mvx / moved
      e.dirz = mvz / moved
      e.acc += moved
      while (e.acc >= STEP_DIST) {
        e.acc -= STEP_DIST
        // Pie alterno: desplaza la huella perpendicular a la marcha.
        const perpx = -e.dirz
        const perpz = e.dirx
        const side = (e.foot = -e.foot)
        const p = prints[e.next]
        e.next = (e.next + 1) % COUNT
        p.x = px + perpx * FOOT_OFFSET * side
        p.z = pz + perpz * FOOT_OFFSET * side
        p.y = sampleHeight(p.x, p.z) + PRINT_LIFT
        p.rot = Math.atan2(e.dirx, e.dirz)
        p.scl = 0.42 + Math.random() * 0.08
        p.age = 0
      }
    }
    e.lx = px
    e.lz = pz

    // Envejece y dibuja cada huella.
    for (let i = 0; i < COUNT; i++) {
      const p = prints[i]
      const m = refs.current[i]
      if (!m) continue
      if (p.age === Infinity) {
        m.visible = false
        continue
      }
      p.age += d
      const k = p.age / LIFE
      if (k >= 1) {
        p.age = Infinity
        m.visible = false
        continue
      }
      m.visible = true
      m.position.set(p.x, p.y, p.z)
      m.rotation.set(-Math.PI / 2, 0, p.rot)
      // Aparece nítida y se desvanece encogiendo un poco al final.
      m.material.opacity = MAX_OPACITY * (1 - k) * Math.min(p.age * 6, 1)
      m.scale.setScalar(p.scl * (1 - k * 0.25))
    }
  })

  return (
    <group>
      {prints.map((_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} visible={false} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1, 1.35]} />
          <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0} />
        </mesh>
      ))}
    </group>
  )
}
