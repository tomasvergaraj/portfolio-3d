import React, { useRef, useMemo, useLayoutEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { worldState } from './worldState'

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
    worldState.dusk = k // 0 día → 1 atardecer (lo leen las luciérnagas)
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

// ── Mariposas (de día) ────────────────────────────────────────────────────
const BFLY_COUNT = 12
const BFLY_COLORS = ['#f5a3c7', '#ffd166', '#9ad0f5', '#f78c6b', '#b9a7f0', '#a0d995']
const _b = new THREE.Object3D()
const _bc = new THREE.Color()

export function Butterflies() {
  const ref = useRef()
  const items = useMemo(
    () =>
      Array.from({ length: BFLY_COUNT }, () => {
        const a = Math.random() * Math.PI * 2
        const r = 5 + Math.random() * 15
        return {
          cx: Math.cos(a) * r,
          cz: Math.sin(a) * r,
          rx: 1 + Math.random() * 2.5,
          rz: 1 + Math.random() * 2.5,
          sp: 0.4 + Math.random() * 0.6,
          ph: Math.random() * Math.PI * 2,
          y: 0.9 + Math.random() * 1.8,
          flap: 8 + Math.random() * 6,
          sc: 0.18 + Math.random() * 0.12,
        }
      }),
    []
  )

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < BFLY_COUNT; i++) m.setColorAt(i, _bc.set(BFLY_COLORS[i % BFLY_COLORS.length]))
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [items])

  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    m.material.opacity = 0.95 * Math.max(1 - worldState.dusk, 0) // se retiran al atardecer
    m.visible = m.material.opacity > 0.02
    for (let i = 0; i < BFLY_COUNT; i++) {
      const b = items[i]
      const x = b.cx + Math.sin(t * b.sp + b.ph) * b.rx
      const z = b.cz + Math.cos(t * b.sp * 0.8 + b.ph) * b.rz
      const y = b.y + Math.sin(t * 1.5 + b.ph) * 0.25
      _b.position.set(x, y, z)
      _b.quaternion.copy(state.camera.quaternion)
      const flap = 0.35 + 0.65 * Math.abs(Math.sin(t * b.flap + b.ph))
      _b.scale.set(b.sc * flap, b.sc, 1)
      _b.updateMatrix()
      m.setMatrixAt(i, _b.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BFLY_COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial vertexColors transparent depthWrite={false} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}

// ── Luciérnagas (al atardecer) ────────────────────────────────────────────
const FF_COUNT = 55
const _f = new THREE.Object3D()

export function Fireflies() {
  const ref = useRef()
  const items = useMemo(
    () =>
      Array.from({ length: FF_COUNT }, () => {
        const a = Math.random() * Math.PI * 2
        const r = 4 + Math.random() * 16
        return {
          cx: Math.cos(a) * r,
          cz: Math.sin(a) * r,
          rng: 0.6 + Math.random() * 1.8,
          sp: 0.2 + Math.random() * 0.5,
          ph: Math.random() * Math.PI * 2,
          y: 0.8 + Math.random() * 1.8,
          blink: 1.5 + Math.random() * 2.5,
          sc: 0.06 + Math.random() * 0.05,
        }
      }),
    []
  )

  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    // Aparecen pasada la mitad del ciclo hacia el atardecer.
    m.material.opacity = Math.max((worldState.dusk - 0.35) / 0.65, 0)
    m.visible = m.material.opacity > 0.01
    if (!m.visible) return
    for (let i = 0; i < FF_COUNT; i++) {
      const f = items[i]
      const x = f.cx + Math.sin(t * f.sp + f.ph) * f.rng
      const z = f.cz + Math.cos(t * f.sp * 1.1 + f.ph) * f.rng
      const y = f.y + Math.sin(t * 0.7 + f.ph) * 0.4
      const blink = 0.3 + 0.7 * Math.max(Math.sin(t * f.blink + f.ph), 0)
      _f.position.set(x, y, z)
      _f.scale.setScalar(f.sc * blink + 0.0001)
      _f.updateMatrix()
      m.setMatrixAt(i, _f.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, FF_COUNT]} frustumCulled={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#ffe08a" transparent depthWrite={false} toneMapped={false} />
    </instancedMesh>
  )
}

// ── Pájaros cruzando el cielo ─────────────────────────────────────────────
const BIRD_COUNT = 7
const _bird = new THREE.Object3D()

function birdTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  g.strokeStyle = '#2e3742'
  g.lineWidth = 7
  g.lineCap = 'round'
  g.beginPath()
  g.moveTo(8, 40)
  g.quadraticCurveTo(22, 16, 32, 34)
  g.quadraticCurveTo(42, 16, 56, 40)
  g.stroke()
  return new THREE.CanvasTexture(c)
}

export function Birds() {
  const ref = useRef()
  const tex = useMemo(birdTexture, [])
  const flock = useMemo(
    () =>
      Array.from({ length: BIRD_COUNT }, () => ({
        ox: (Math.random() * 2 - 1) * 5,
        oy: (Math.random() * 2 - 1) * 2.2,
        oz: (Math.random() * 2 - 1) * 4,
        ph: Math.random() * Math.PI * 2,
        sc: 1 + Math.random() * 0.5,
      })),
    []
  )
  const fl = useRef({ t: 999, dur: 1, next: 5, ax: 0, az: 0, bx: 0, bz: 0, y: 0 })

  useFrame((state, dt) => {
    const m = ref.current
    if (!m) return
    const f = fl.current
    f.t += dt
    let active = f.t <= f.dur
    if (!active) {
      f.next -= dt
      if (f.next <= 0) {
        const ang = Math.random() * Math.PI * 2
        const span = 90
        f.ax = Math.cos(ang) * -span / 2
        f.az = Math.sin(ang) * -span / 2
        f.bx = Math.cos(ang) * span / 2
        f.bz = Math.sin(ang) * span / 2
        f.y = 15 + Math.random() * 9
        f.dur = 8 + Math.random() * 4
        f.t = 0
        f.next = 14 + Math.random() * 18
        active = true
      }
    }
    m.visible = active
    if (!active) return
    const t = state.clock.elapsedTime
    const p = f.t / f.dur
    const cx = THREE.MathUtils.lerp(f.ax, f.bx, p)
    const cz = THREE.MathUtils.lerp(f.az, f.bz, p)
    for (let i = 0; i < BIRD_COUNT; i++) {
      const bd = flock[i]
      _bird.position.set(cx + bd.ox, f.y + bd.oy, cz + bd.oz)
      _bird.quaternion.copy(state.camera.quaternion)
      const flap = Math.abs(Math.sin(t * 9 + bd.ph))
      _bird.scale.set(bd.sc, bd.sc * (0.5 + 0.5 * flap), 1) // aleteo (escala Y)
      _bird.updateMatrix()
      m.setMatrixAt(i, _bird.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, BIRD_COUNT]} frustumCulled={false} visible={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} />
    </instancedMesh>
  )
}
