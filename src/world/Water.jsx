import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleWind } from './wind'

const SIZE = 220
const SEG = 64
const SHORE = 23 // radio aproximado de la orilla de la isla

const SHALLOW = new THREE.Color('#5fc6c0') // aqua junto a la orilla
const DEEP = new THREE.Color('#1f5f86') // azul profundo mar adentro
const FOAM = new THREE.Color('#e7f4f5') // espuma clara en la rompiente

// Plano de agua con desplazamiento senoidal en los vértices para un oleaje
// low-poly suave. El oleaje viaja en la dirección del VIENTO global (el mismo
// vector que mueve pasto, hojas y polvo) y su amplitud crece con la racha. Color
// con profundidad (gradiente radial orilla→mar) y una banda de espuma en la
// orilla. Animación desactivable.
export function Water({ animate = true }) {
  const ref = useRef()
  const geo = useMemo(() => {
    const g = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG)
    // Gradiente radial por vértice: claro cerca del centro (la isla), profundo
    // hacia afuera, con una banda de espuma en la rompiente. Da fondo y orilla.
    const pos = g.attributes.position
    const colors = new Float32Array(pos.count * 3)
    const c = new THREE.Color()
    for (let i = 0; i < pos.count; i++) {
      const r = Math.hypot(pos.array[i * 3], pos.array[i * 3 + 1])
      const t = THREE.MathUtils.clamp((r - 22) / 60, 0, 1)
      c.copy(SHALLOW).lerp(DEEP, t)
      // Espuma: máxima justo en la orilla y se disuelve mar adentro.
      const foam = 1 - THREE.MathUtils.smoothstep(r, SHORE, SHORE + 6)
      c.lerp(FOAM, foam * 0.55)
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
    const w = sampleWind(t)
    // El oleaje principal viaja en la dirección del viento; su amplitud y su
    // velocidad suben con la racha. Una segunda onda cruzada (perpendicular al
    // viento) y un rizo fino rompen el patrón para que no se vea como bandas.
    const px = w.dirX
    const pz = w.dirZ
    const amp = 0.42 + w.strength * 0.55
    const speed = 0.7 + w.strength * 0.9
    const pos = ref.current.geometry.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3]
      const y = base[i * 3 + 1]
      const along = x * px + y * pz // distancia proyectada en la dirección del viento
      const across = -x * pz + y * px // eje perpendicular
      const wave =
        Math.sin(along * 0.09 - t * speed) * amp +
        Math.sin(across * 0.13 - t * speed * 0.55) * amp * 0.4 +
        Math.sin(along * 0.27 - t * speed * 1.7) * amp * 0.18 // rizo fino
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
