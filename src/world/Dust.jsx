import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { playerPos, playerMotion } from './playerState'
import { sampleWind } from './wind'
import { sampleHeight } from './terrain'

// Polvo bajo el personaje al caminar/correr: pequeñas motas que suben, crecen y
// se desvanecen. Más frecuentes al hacer sprint. Da peso y velocidad al avance.
const COUNT = 32
const _d = new THREE.Object3D()

function softTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32)
  grd.addColorStop(0, 'rgba(255,255,255,0.9)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, 64, 64)
  return new THREE.CanvasTexture(c)
}

export function Dust() {
  const ref = useRef()
  const tex = useMemo(softTexture, [])
  const parts = useMemo(
    () => Array.from({ length: COUNT }, () => ({ life: 0, max: 1, x: 0, y: -100, z: 0, vy: 0, scale: 0, dir: 0, drift: 0 })),
    []
  )
  const emit = useRef(0)
  // Estado de salto del frame anterior, para detectar el aterrizaje (flanco
  // jumping true→false) y soltar una polvareda en anillo bajo los pies.
  const prevJumping = useRef(false)

  useFrame((state, dt) => {
    const m = ref.current
    if (!m) return
    const d = Math.min(dt, 0.05)
    const w = sampleWind(state.clock.elapsedTime)
    // Altura del suelo bajo los pies (sigue el relieve del terreno).
    const gy = sampleHeight(playerPos.x, playerPos.z)

    // Aterrizaje: al pasar de saltando a no-saltando, suelta un anillo de polvo
    // que sale disparado hacia afuera bajo los pies (impacto).
    if (prevJumping.current && !playerMotion.jumping) {
      const n = 12
      for (let k = 0; k < n; k++) {
        const p = parts.find((q) => q.life <= 0)
        if (!p) break
        const a = (k / n) * Math.PI * 2 + Math.random() * 0.4
        const r = 0.18 + Math.random() * 0.2
        p.life = p.max = 0.6
        p.x = playerPos.x + Math.cos(a) * r
        p.z = playerPos.z + Math.sin(a) * r
        p.y = gy
        p.vy = 0.12 + Math.random() * 0.22
        p.scale = 0.22 + Math.random() * 0.18
        p.dir = a
        p.drift = 0.9 + Math.random() * 0.7 // sale disparado en anillo
      }
    }
    prevJumping.current = playerMotion.jumping

    // Emisión mientras se mueve (más al correr).
    if (playerMotion.moving) {
      const rate = playerMotion.sprint ? 0.035 : 0.07
      emit.current -= d
      while (emit.current <= 0) {
        emit.current += rate
        const p = parts.find((q) => q.life <= 0)
        if (p) {
          p.life = p.max = playerMotion.sprint ? 0.55 : 0.8
          const a = Math.random() * Math.PI * 2
          const r = 0.1 + Math.random() * 0.25
          p.x = playerPos.x + Math.cos(a) * r
          p.z = playerPos.z + Math.sin(a) * r
          p.y = gy
          p.vy = 0.25 + Math.random() * 0.4
          p.scale = 0.16 + Math.random() * 0.16
          p.dir = a
          p.drift = 0.15 + Math.random() * 0.3
        } else break
      }
    }

    for (let i = 0; i < COUNT; i++) {
      const p = parts[i]
      if (p.life > 0) {
        p.life -= d
        p.y += p.vy * d
        // Deriva radial propia (de la pisada) + arrastre del viento global.
        p.x += (Math.cos(p.dir) * p.drift + w.dirX * w.strength * 0.55) * d
        p.z += (Math.sin(p.dir) * p.drift + w.dirZ * w.strength * 0.55) * d
        const k = Math.max(p.life / p.max, 0) // 1 → 0
        const grow = 1.4 - 0.9 * k
        _d.position.set(p.x, p.y, p.z)
        _d.quaternion.copy(state.camera.quaternion) // billboard
        _d.scale.setScalar(p.scale * grow * k + 0.0001) // crece y se desvanece
        _d.updateMatrix()
        m.setMatrixAt(i, _d.matrix)
      } else {
        _d.position.set(0, -100, 0)
        _d.scale.setScalar(0.0001)
        _d.updateMatrix()
        m.setMatrixAt(i, _d.matrix)
      }
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, COUNT]} frustumCulled={false}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial map={tex} transparent depthWrite={false} opacity={0.45} color="#d8c9a8" />
    </instancedMesh>
  )
}
