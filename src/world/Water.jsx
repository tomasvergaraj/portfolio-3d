import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const SIZE = 220
const SEG = 64

const SHALLOW = new THREE.Color('#5fc6c0') // aqua junto a la orilla
const DEEP = new THREE.Color('#1f5f86') // azul profundo mar adentro

// Plano de agua con desplazamiento senoidal en los vértices para un oleaje
// low-poly suave. Color con profundidad (gradiente radial orilla→mar) y un
// brillo especular más marcado para captar el cielo. Animación desactivable.
export function Water({ animate = true }) {
  const ref = useRef()
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG)
    // Gradiente radial por vértice: claro cerca del centro (la isla), profundo
    // hacia afuera. Da sensación de fondo y de mar abierto.
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.array[i * 3], pos.array[i * 3 + 1])
      const t = THREE.MathUtils.clamp((r - 22) / 60, 0, 1)
      c.copy(SHALLOW).lerp(DEEP, t)
      colors[i * 3] = c.r
      colors[i * 3 + 1] = c.g
      colors[i * 3 + 2] = c.b
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    return g
  }, [])
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
        vertexColors
        roughness={0.22}
        metalness={0.25}
        transparent
        opacity={0.94}
        flatShading
      />
    </mesh>
  )
}
