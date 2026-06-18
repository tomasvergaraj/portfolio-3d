import React, { useMemo } from 'react'
import * as THREE from 'three'
import { STATIONS, stationPosition } from '../data/stations'
import { makeGroundTexture } from './textures'

const ISLAND_R = 24

// Isla circular: una tapa de pasto, un talud de tierra hacia el agua y un
// borde de arena. Caminos rectos del centro a cada estación.
export function Island() {
  // Texturas procedurales del suelo (una sola vez). Manchas suaves + grano fino,
  // tileables; el color va horneado en la textura (material en blanco).
  const { grassTex, sandTex, plazaTex } = useMemo(() => {
    const grassTex = makeGroundTexture({ base: '#9dbe7a', light: '#aecb8a', dark: '#88a567', spots: 90, seed: 7 })
    grassTex.repeat.set(7, 7)
    const sandTex = makeGroundTexture({ base: '#e6d6b0', light: '#f0e4c8', dark: '#d6c49c', spots: 50, seed: 3 })
    sandTex.repeat.set(8, 8)
    const plazaTex = makeGroundTexture({ base: '#ddc9a0', light: '#e9d8b4', dark: '#cdb88c', spots: 40, seed: 5 })
    plazaTex.repeat.set(3, 3)
    return { grassTex, sandTex, plazaTex }
  }, [])

  // Textura de arena para los caminos: misma imagen, repetición propia (largos).
  const pathTex = useMemo(() => {
    const t = sandTex.clone()
    t.needsUpdate = true
    t.repeat.set(1.2, 6)
    return t
  }, [sandTex])

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
        <meshStandardMaterial map={grassTex} roughness={1} flatShading />
      </mesh>

      {/* Talud de tierra */}
      <mesh position={[0, -3.2, 0]}>
        <cylinderGeometry args={[ISLAND_R, ISLAND_R * 0.5, 6, 72]} />
        <meshStandardMaterial color="#8a6b4a" roughness={1} flatShading />
      </mesh>

      {/* Anillo de arena en la orilla */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.72, 0]} receiveShadow>
        <ringGeometry args={[ISLAND_R - 2.4, ISLAND_R + 0.3, 72]} />
        <meshStandardMaterial map={sandTex} roughness={1} side={THREE.DoubleSide} />
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
          <meshStandardMaterial map={pathTex} roughness={1} />
        </mesh>
      ))}

      {/* Plaza central */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.74, 0]} receiveShadow>
        <circleGeometry args={[3.2, 48]} />
        <meshStandardMaterial map={plazaTex} roughness={1} />
      </mesh>
    </group>
  )
}
