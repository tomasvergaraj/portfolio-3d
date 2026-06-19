import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Chorro de la fuente del centro de la plaza: gotas que salen disparadas hacia
// arriba con algo de apertura, caen por gravedad y se reciclan. La fuente es el
// punto focal de casi todos los encuadres (la cámara la mira de frente), así que
// darle agua viva la hace mucho más creíble. Todas las gotas comparten un único
// instancedMesh (una draw call). Se congela con prefers-reduced-motion.
const COUNT = 90
const ORIGIN_Y = 1.95 // boca del surtidor (la fuente mide ~2.6 de alto)
const BASIN_Y = 1.15 // nivel del pilón: por debajo de esto la gota se recicla
const GRAVITY = 9.0
const _o = new THREE.Object3D()

export function FountainSpray({ position = [0, 0, 0], reducedMotion = false }) {
  const ref = useRef()
  const drops = useMemo(
    () =>
      Array.from({ length: COUNT }, () => ({
        x: 0,
        y: ORIGIN_Y,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        s: 0.05 + Math.random() * 0.06,
        seed: Math.random(),
      })),
    []
  )

  // Lanza una gota desde la boca con velocidad sobre todo vertical y una pequeña
  // apertura radial, para que el chorro se abra como un surtidor.
  const launch = (d) => {
    const a = Math.random() * Math.PI * 2
    const spread = 0.7 + Math.random() * 1.4
    d.x = 0
    d.y = ORIGIN_Y
    d.z = 0
    d.vx = Math.cos(a) * spread
    d.vz = Math.sin(a) * spread
    d.vy = 4.2 + Math.random() * 1.6
    d.s = 0.05 + Math.random() * 0.06
  }

  useFrame((state, dt) => {
    const m = ref.current
    if (!m) return
    // Estático con reduced-motion: deja las gotas escondidas bajo el pilón.
    if (reducedMotion) {
      for (let i = 0; i < COUNT; i++) {
        _o.position.set(0, -10, 0)
        _o.scale.setScalar(0.0001)
        _o.updateMatrix()
        m.setMatrixAt(i, _o.matrix)
      }
      m.instanceMatrix.needsUpdate = true
      return
    }
    const d = Math.min(dt, 0.05)
    for (let i = 0; i < COUNT; i++) {
      const p = drops[i]
      // Arranque escalonado: cada gota espera su turno según su semilla para que
      // el chorro sea continuo y no salgan todas a la vez.
      if (p.vy === 0 && p.y >= ORIGIN_Y) {
        if (state.clock.elapsedTime % 1 > p.seed) launch(p)
      }
      p.vy -= GRAVITY * d
      p.x += p.vx * d
      p.y += p.vy * d
      p.z += p.vz * d
      if (p.y < BASIN_Y && p.vy < 0) {
        p.vy = 0
        p.y = ORIGIN_Y // listo para volver a lanzarse
      }
      _o.position.set(p.x, p.y, p.z)
      _o.scale.setScalar(p.s)
      _o.updateMatrix()
      m.setMatrixAt(i, _o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <group position={position}>
      <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#dff3ff" roughness={0.2} metalness={0.1} emissive="#bfe6ff" emissiveIntensity={0.25} />
      </instancedMesh>
    </group>
  )
}
