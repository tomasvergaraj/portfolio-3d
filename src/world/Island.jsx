import React, { useMemo } from 'react'
import * as THREE from 'three'
import { sampleHeight, TOP_Y, ISLAND_R, AMP } from './terrain'

// Isla circular: una tapa de pasto con RELIEVE (lomas suaves), un faldón verde
// vertical en el borde, un talud de tierra hacia el agua y un anillo de arena.
// Los caminos los dibuja el empedrado (Walkway).

// Resolución de la malla de pasto. Una rejilla radial (anillos × sectores) es
// circular por construcción y, con flatShading, da facetas low-poly limpias.
const RINGS = 26
const SEG = 76

// Tinte por altura: los valles/plano conservan el verde base; las cimas reciben
// un verde más luminoso (sol). Hace que el relieve se lea como terreno real en
// vez de bultos planos, sobre todo con la cámara casi cenital.
const VALLEY = new THREE.Color('#9dbe7a')
const HILLTOP = new THREE.Color('#c2d899')
const _c = new THREE.Color()

function buildGrassTop() {
  const positions = []
  const colors = []
  const indices = []

  const pushVertex = (x, y, z) => {
    positions.push(x, y, z)
    const h01 = Math.min(Math.max((y - TOP_Y) / AMP, 0), 1)
    _c.copy(VALLEY).lerp(HILLTOP, h01)
    colors.push(_c.r, _c.g, _c.b)
  }

  // Vértice central.
  pushVertex(0, sampleHeight(0, 0), 0)

  for (let ri = 1; ri <= RINGS; ri++) {
    const r = (ri / RINGS) * ISLAND_R
    for (let si = 0; si < SEG; si++) {
      const a = (si / SEG) * Math.PI * 2
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      // El rim se fuerza al baseline para matar limpio con el faldón.
      const y = ri === RINGS ? TOP_Y : sampleHeight(x, z)
      pushVertex(x, y, z)
    }
  }

  // Abanico central (anillo 0 → anillo 1).
  for (let si = 0; si < SEG; si++) {
    const a = 1 + si
    const b = 1 + ((si + 1) % SEG)
    indices.push(0, a, b)
  }
  // Quads entre anillos consecutivos.
  for (let ri = 1; ri < RINGS; ri++) {
    const base0 = 1 + (ri - 1) * SEG
    const base1 = 1 + ri * SEG
    for (let si = 0; si < SEG; si++) {
      const a = base0 + si
      const b = base0 + ((si + 1) % SEG)
      const c = base1 + si
      const d = base1 + ((si + 1) % SEG)
      indices.push(a, c, b, b, c, d)
    }
  }

  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  g.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
  g.setIndex(indices)
  g.computeVertexNormals()
  // Garantía de orientación: si la normal del centro apunta hacia abajo, el
  // bobinado quedó invertido — lo damos vuelta para que la cara mire al cielo
  // (si no, la tapa sale oscura y no recibe sombras).
  if (g.attributes.normal.getY(0) < 0) {
    const idx = g.index.array
    for (let i = 0; i < idx.length; i += 3) {
      const t = idx[i + 1]
      idx[i + 1] = idx[i + 2]
      idx[i + 2] = t
    }
    g.index.needsUpdate = true
    g.computeVertexNormals()
  }
  return g
}

export function Island() {
  const grassTop = useMemo(buildGrassTop, [])

  return (
    <group>
      {/* Tapa de pasto con relieve (lomas) y tinte por altura */}
      <mesh geometry={grassTop} receiveShadow>
        <meshStandardMaterial vertexColors roughness={1} flatShading />
      </mesh>

      {/* Faldón verde vertical del borde (cilindro abierto que cierra el canto
          entre el rim de la tapa, y=TOP_Y, y el inicio del talud). */}
      <mesh position={[0, TOP_Y - 0.7, 0]} receiveShadow>
        <cylinderGeometry args={[ISLAND_R, ISLAND_R, 1.4, SEG, 1, true]} />
        <meshStandardMaterial color="#94b572" roughness={1} flatShading side={THREE.DoubleSide} />
      </mesh>

      {/* Talud de tierra */}
      <mesh position={[0, -3.2, 0]}>
        <cylinderGeometry args={[ISLAND_R, ISLAND_R * 0.5, 6, 72]} />
        <meshStandardMaterial color="#8a6b4a" roughness={1} flatShading />
      </mesh>

      {/* Anillo de arena en la orilla */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.72, 0]} receiveShadow>
        <ringGeometry args={[ISLAND_R - 2.4, ISLAND_R + 0.3, 72]} />
        <meshStandardMaterial color="#e6d6b0" roughness={1} side={THREE.DoubleSide} />
      </mesh>
    </group>
  )
}
