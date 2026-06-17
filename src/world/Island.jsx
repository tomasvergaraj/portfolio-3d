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

      {/* Caminos de arena del centro a cada estación */}
      {paths.map((p) => (
        <mesh
          key={p.id}
          rotation={[-Math.PI / 2, 0, -p.angle]}
          position={[p.x / 2, 0.73, p.z / 2]}
          receiveShadow
        >
          <planeGeometry args={[2.4, p.len + 1.5]} />
          <meshStandardMaterial color="#e6d6b0" roughness={1} />
        </mesh>
      ))}

      {/* Plaza central */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.74, 0]} receiveShadow>
        <circleGeometry args={[3.2, 48]} />
        <meshStandardMaterial color="#ddc9a0" roughness={1} />
      </mesh>
    </group>
  )
}
