import React from 'react'
import * as THREE from 'three'

const ISLAND_R = 24

// Isla circular: una tapa de pasto, un talud de tierra hacia el agua y un
// borde de arena. Los caminos los dibuja el empedrado (Walkway).
export function Island() {
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
    </group>
  )
}
