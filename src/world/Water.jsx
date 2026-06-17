import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SIZE = 220
const SEG = 64

// Plano de agua con desplazamiento senoidal en los vértices para un oleaje
// low-poly suave. Se puede desactivar la animación (movimiento reducido).
export function Water({ animate = true }) {
  const ref = useRef()
  const geo = useMemo(() => new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG), [])
  const base = useMemo(() => geo.attributes.position.array.slice(), [geo])

  useFrame((state) => {
    if (!animate || !ref.current) return
    const t = state.clock.elapsedTime
    const pos = ref.current.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      const wave =
        Math.sin(x * 0.08 + t * 0.9) * 0.5 + Math.sin(y * 0.11 + t * 0.7) * 0.5
      pos.setZ(i, wave)
    }
    pos.needsUpdate = true
    ref.current.geometry.computeVertexNormals()
  })

  return (
    <mesh ref={ref} geometry={geo} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.4, 0]} receiveShadow>
      <meshStandardMaterial
        color="#3e9aa3"
        roughness={0.35}
        metalness={0.1}
        transparent
        opacity={0.92}
        flatShading
      />
    </mesh>
  )
}
