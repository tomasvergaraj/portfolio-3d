import React, { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

// ── Hojas que caen ────────────────────────────────────────────────────────
// Instancia ligera: hojitas que bajan meciéndose y se reciclan arriba. Da vida
// al aire del mundo (idea del folio de Bruno Simon).
const COUNT = 80
const AREA = 22
const TOP = 8
const GROUND = 0.75
const LEAF_COLORS = ['#86b35a', '#9cc169', '#c7b24e', '#cf913f']
const _d = new THREE.Object3D()
const _c = new THREE.Color()

export function Leaves({ reducedMotion = false }) {
  const ref = useRef()
  const leaves = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: (Math.random() * 2 - 1) * AREA,
        z: (Math.random() * 2 - 1) * AREA,
        y: GROUND + Math.random() * (TOP - GROUND),
        vy: 0.35 + Math.random() * 0.7,
        phase: Math.random() * Math.PI * 2,
        spin: (Math.random() * 2 - 1) * 1.8,
        sway: 0.4 + Math.random() * 0.7,
        scale: 0.09 + Math.random() * 0.12,
      })),
    []
  )

  // Coloca y colorea una vez (también cubre el caso reduced-motion: estáticas).
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < COUNT; i++) {
      const l = leaves[i]
      _d.position.set(l.x, l.y, l.z)
      _d.rotation.set(l.phase, l.phase, l.phase)
      _d.scale.setScalar(l.scale)
      _d.updateMatrix()
      m.setMatrixAt(i, _d.matrix)
      m.setColorAt(i, _c.set(LEAF_COLORS[i % LEAF_COLORS.length]))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [leaves])

  useFrame((state, dt) => {
    const m = ref.current
    if (reducedMotion || !m) return
    const d = Math.min(dt, 0.05)
    const t = state.clock.elapsedTime
    for (let i = 0; i < COUNT; i++) {
      const l = leaves[i]
      l.y -= l.vy * d
      if (l.y < GROUND) {
        l.y = TOP
        l.x = (Math.random() * 2 - 1) * AREA
        l.z = (Math.random() * 2 - 1) * AREA
      }
      _d.position.set(l.x + Math.sin(t * 1.2 + l.phase) * l.sway, l.y, l.z + Math.cos(t * 0.9 + l.phase) * l.sway)
      _d.rotation.set(t * l.spin, t * l.spin * 0.7, l.phase + t * l.spin)
      _d.scale.setScalar(l.scale)
      _d.updateMatrix()
      m.setMatrixAt(i, _d.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={1} />
    </instancedMesh>
  )
}

// ── Día/noche sutil ───────────────────────────────────────────────────────
// Respira la luz principal (intensidad + calidez) y el cielo/niebla en un ciclo
// largo y suave; no llega a "noche" para no romper la dirección de arte.
const DAY_BG = new THREE.Color('#dbeaf3')
const DUSK_BG = new THREE.Color('#e7d8c4')
const WARM = new THREE.Color('#fff1d4')
const COOL = new THREE.Color('#ffe9c8')
const PERIOD = 48 // segundos por ciclo

export function DayNight({ lightRef }) {
  const { scene } = useThree()
  useFrame((state) => {
    const k = 0.5 + 0.5 * Math.sin((state.clock.elapsedTime / PERIOD) * Math.PI * 2)
    if (lightRef?.current) {
      lightRef.current.intensity = 1.55 + k * 0.4
      lightRef.current.color.copy(WARM).lerp(COOL, k)
    }
    const tint = k * 0.5 // como mucho a mitad de camino al atardecer
    _c.copy(DAY_BG).lerp(DUSK_BG, tint)
    if (scene.background?.isColor) scene.background.lerp(_c, 0.05)
    if (scene.fog) scene.fog.color.lerp(_c, 0.05)
  })
  return null
}
