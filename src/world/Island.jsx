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
const SAND = new THREE.Color('#e0cfa0') // pasto que se seca al llegar a la playa
const SAND_BEACH = '#e6d6b0' // arena de la orilla
const _c = new THREE.Color()

// Playa en pendiente: el pasto baja a SHORE_GRASS_Y en el rim y desde ahí una
// arena desciende hasta meterse bajo el agua (BEACH_BOTTOM).
const SHORE_GRASS_Y = 0.45
const BEACH_OUT = 28
const BEACH_BOTTOM = -0.9
const GRASS_EDGE_START = 20 // donde el pasto empieza a rodar hacia la orilla

function buildGrassTop() {
  const positions = []
  const colors = []
  const indices = []

  const pushVertex = (x, y, z) => {
    positions.push(x, y, z)
    const r = Math.hypot(x, z)
    const h01 = Math.min(Math.max((y - TOP_Y) / AMP, 0), 1)
    _c.copy(VALLEY).lerp(HILLTOP, h01)
    // Tinte arenoso hacia el borde (el pasto se "seca" al llegar a la playa).
    _c.lerp(SAND, THREE.MathUtils.smoothstep(r, 21, 24) * 0.85)
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
      // El borde rueda hacia la orilla: la altura del relieve baja a
      // SHORE_GRASS_Y, así el pasto entrega el paso a la arena sin un corte seco.
      const edge = THREE.MathUtils.smoothstep(r, GRASS_EDGE_START, ISLAND_R)
      const y = ri === RINGS ? SHORE_GRASS_Y : THREE.MathUtils.lerp(sampleHeight(x, z), SHORE_GRASS_Y, edge)
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

      {/* Playa en pendiente: arena que baja del rim del pasto (SHORE_GRASS_Y)
          hasta meterse bajo el agua, reemplazando el viejo canto vertical. */}
      <mesh position={[0, (SHORE_GRASS_Y + BEACH_BOTTOM) / 2, 0]} receiveShadow>
        <cylinderGeometry
          args={[ISLAND_R, BEACH_OUT, SHORE_GRASS_Y - BEACH_BOTTOM, SEG, 1, true]}
        />
        <meshStandardMaterial color={SAND_BEACH} roughness={1} flatShading side={THREE.DoubleSide} />
      </mesh>

      {/* Talud de tierra (masa sumergida bajo la playa) */}
      <mesh position={[0, -3.2, 0]}>
        <cylinderGeometry args={[ISLAND_R, ISLAND_R * 0.5, 6, 72]} />
        <meshStandardMaterial color="#8a6b4a" roughness={1} flatShading />
      </mesh>
    </group>
  )
}
