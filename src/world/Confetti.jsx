import React, { useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore } from '../store'
import { playerPos } from './playerState'

// Ráfaga de confeti (easter egg del Konami): papelitos de colores que estallan
// sobre el avatar, suben, giran y caen con gravedad, desvaneciéndose. Estallan
// justo donde está el jugador (que es el foco del DoF), así salen nítidos. Un
// único InstancedMesh con color por instancia; inactivo (sin coste) salvo durante
// la ráfaga. Idea del folio de Bruno Simon (Confetti + KonamiCode).
const COUNT = 150
const COLORS = ['#ff5d8f', '#ffd23f', '#3ad6c5', '#6a8bff', '#ff8a3d', '#b78bff', '#7ed957', '#ffffff']
const GRAVITY = 9.5
const _o = new THREE.Object3D()
const _c = new THREE.Color()

function hide(m, i) {
  _o.position.set(0, -100, 0)
  _o.scale.setScalar(0.0001)
  _o.updateMatrix()
  m.setMatrixAt(i, _o.matrix)
}

export function Confetti() {
  const ref = useRef()
  const n = useStore((s) => s.confettiN)
  const active = useRef(false)
  const parts = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        life: 0, x: 0, y: -100, z: 0, vx: 0, vy: 0, vz: 0,
        rx: 0, ry: 0, rz: 0, sx: 0, sy: 0, sz: 0, s: 0.12,
      })),
    []
  )

  // Oculta todas las instancias al montar (si no, quedan quads en el origen).
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < COUNT; i++) hide(m, i)
    m.instanceMatrix.needsUpdate = true
  }, [])

  // Lanza una ráfaga cuando cambia el contador (no en el montaje, n=0).
  useEffect(() => {
    if (n === 0) return
    const ox = playerPos.x
    const oy = playerPos.y + 2.4
    const oz = playerPos.z
    for (let i = 0; i < COUNT; i++) {
      const p = parts[i]
      const a = Math.random() * Math.PI * 2
      const sp = 1.4 + Math.random() * 3.6
      p.x = ox + (Math.random() - 0.5) * 0.6
      p.y = oy
      p.z = oz + (Math.random() - 0.5) * 0.6
      p.vx = Math.cos(a) * sp
      p.vz = Math.sin(a) * sp
      p.vy = 4 + Math.random() * 4.5
      p.rx = Math.random() * Math.PI
      p.ry = Math.random() * Math.PI
      p.rz = Math.random() * Math.PI
      p.sx = (Math.random() - 0.5) * 9
      p.sy = (Math.random() - 0.5) * 9
      p.sz = (Math.random() - 0.5) * 9
      p.s = 0.09 + Math.random() * 0.08
      p.life = 2.2 + Math.random() * 1.3
    }
    active.current = true
    const m = ref.current
    if (m) {
      for (let i = 0; i < COUNT; i++) m.setColorAt(i, _c.set(COLORS[i % COLORS.length]))
      if (m.instanceColor) m.instanceColor.needsUpdate = true
    }
  }, [n, parts])

  useFrame((state, dt) => {
    const m = ref.current
    if (!m || !active.current) return
    const d = Math.min(dt, 0.05)
    let any = false
    for (let i = 0; i < COUNT; i++) {
      const p = parts[i]
      if (p.life > 0) {
        any = true
        p.life -= d
        p.vy -= GRAVITY * d
        p.x += p.vx * d
        p.y += p.vy * d
        p.z += p.vz * d
        p.vx *= 0.985 // resistencia del aire (revoloteo)
        p.vz *= 0.985
        p.rx += p.sx * d
        p.ry += p.sy * d
        p.rz += p.sz * d
        const k = Math.min(p.life, 0.5) / 0.5 // encoge al final (desvanecido)
        _o.position.set(p.x, p.y, p.z)
        _o.rotation.set(p.rx, p.ry, p.rz)
        _o.scale.set(p.s * k, p.s * 1.5 * k, p.s * k) // papelito alargado
        _o.updateMatrix()
        m.setMatrixAt(i, _o.matrix)
      } else {
        hide(m, i)
      }
    }
    m.instanceMatrix.needsUpdate = true
    if (!any) active.current = false
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial side={THREE.DoubleSide} toneMapped={false} />
    </instancedMesh>
  )
}
