import React, { useMemo } from 'react'
import * as THREE from 'three'
import { STATIONS, stationPosition } from '../data/stations'

const ISLAND_R = 24

// Isla circular: una tapa de pasto, un talud de tierra hacia el agua y un
// borde de arena. Caminos rectos del centro a cada estación.
export function Island() {
  const paths = useMemo(
    () =>
      STATIONS.map((st) => {
        const [x, , z] = stationPosition(st.angle)
        const len = Math.hypot(x, z)
        const angle = Math.atan2(x, z) // orientación del camino
        return { x, z, len, angle, id: st.id }
      }),
    []
  )

  return (
    <group>
      {/* Tapa de pasto */}
      <mesh receiveShadow position={[0, 0, 0]}>
        <cylinderGeometry args={[ISLAND_R, ISLAND_R, 1.4, 72]} />
        <meshStandardMaterial color="#9dbe7a" roughness={1} flatShading />
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

      {/* Base de tierra solo en el tramo EXTERIOR de cada camino (el centro
          queda con el empedrado y el Town Center; sin base café en el medio). */}
      {paths.map((p) => {
        const dirx = p.x / p.len
        const dirz = p.z / p.len
        const rInner = 7 // a partir de aquí hacia afuera
        const rOuter = p.len + 0.5
        const segLen = rOuter - rInner
        const midR = (rInner + rOuter) / 2
        return (
          <mesh
            key={p.id}
            rotation={[-Math.PI / 2, 0, -p.angle]}
            position={[dirx * midR, 0.73, dirz * midR]}
            receiveShadow
          >
            <planeGeometry args={[2.4, segLen]} />
            <meshStandardMaterial color="#cdbd97" roughness={1} />
          </mesh>
        )
      })}
    </group>
  )
}
