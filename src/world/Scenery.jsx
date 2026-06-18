import React, { useMemo, Suspense } from 'react'
import { Float } from '@react-three/drei'
import { STATIONS, stationPosition } from '../data/stations'
import { ModelTrees, TREE_MODEL_URL } from './TreeModel'
import { ModelRocks, ROCK_MODEL_URL } from './RockModel'
import { ModelBoundary } from './ModelBoundary'

// PRNG determinista para que la escena se vea igual en cada carga.
function mulberry32(seed) {
  return function () {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Árbol de primitivas: fallback si el glb no carga, o si TREE_MODEL_URL es null.
function ProceduralTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.16, 0.22, 1.8, 6]} />
        <meshStandardMaterial color="#7c5a3a" roughness={1} flatShading />
      </mesh>
      <mesh castShadow position={[0, 2.4, 0]}>
        <coneGeometry args={[1.1, 2.4, 7]} />
        <meshStandardMaterial color="#6f9f54" roughness={1} flatShading />
      </mesh>
      <mesh castShadow position={[0, 3.5, 0]}>
        <coneGeometry args={[0.8, 1.7, 7]} />
        <meshStandardMaterial color="#7cae5e" roughness={1} flatShading />
      </mesh>
    </group>
  )
}

// Roca de primitivas: fallback si el glb no carga, o si ROCK_MODEL_URL es null.
function ProceduralRock({ position, scale = 1 }) {
  return (
    <mesh castShadow position={position} scale={scale} rotation={[0.3, 0.8, 0.1]}>
      <dodecahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color="#9aa0a6" roughness={1} flatShading />
    </mesh>
  )
}

function Cloud3({ position, scale = 1 }) {
  return (
    <Float speed={1.1} rotationIntensity={0} floatIntensity={0.6}>
      <group position={position} scale={scale}>
        {[
          [0, 0, 0, 1.4],
          [1.3, -0.2, 0.2, 1],
          [-1.2, -0.1, -0.2, 1.1],
          [0.5, 0.4, 0.4, 0.9],
        ].map(([x, y, z, r], i) => (
          <mesh key={i} position={[x, y, z]}>
            <sphereGeometry args={[r, 14, 14]} />
            <meshStandardMaterial color="#ffffff" roughness={1} />
          </mesh>
        ))}
      </group>
    </Float>
  )
}

export function Scenery() {
  const { trees, rocks } = useMemo(() => {
    const rnd = mulberry32(20240617)
    const stationAngles = STATIONS.map((s) => s.angle)
    const trees = []
    const rocks = []

    const farFromStations = (x, z) => {
      for (const a of stationAngles) {
        const [sx, , sz] = stationPosition(a)
        if (Math.hypot(x - sx, z - sz) < 4.2) return false
      }
      return true
    }

    let guard = 0
    while (trees.length < 9 && guard < 400) {
      guard++
      const a = rnd() * Math.PI * 2
      const r = 5 + rnd() * 16
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      // Evitar tapar los caminos (cerca de los ejes radiales a estaciones)
      if (!farFromStations(x, z)) continue
      // Evitar el centro
      if (Math.hypot(x, z) < 4.5) continue
      trees.push({ position: [x, 0.7, z], scale: 0.7 + rnd() * 0.6, rot: rnd() * Math.PI * 2 })
    }

    guard = 0
    while (rocks.length < 9 && guard < 200) {
      guard++
      const a = rnd() * Math.PI * 2
      const r = 6 + rnd() * 15
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      rocks.push({ position: [x, 0.9, z], scale: 0.6 + rnd() * 0.9, rot: rnd() * Math.PI * 2 })
    }

    return { trees, rocks }
  }, [])

  // Árboles con modelo 3D real (geometría compartida) y fallback a primitivas
  // mientras carga o si el glb falla.
  const proceduralTrees = (
    <>
      {trees.map((t, i) => (
        <ProceduralTree key={`t${i}`} {...t} />
      ))}
    </>
  )

  const proceduralRocks = (
    <>
      {rocks.map((r, i) => (
        <ProceduralRock key={`r${i}`} {...r} />
      ))}
    </>
  )

  return (
    <group>
      {TREE_MODEL_URL ? (
        <ModelBoundary fallback={proceduralTrees}>
          <Suspense fallback={proceduralTrees}>
            <ModelTrees trees={trees} />
          </Suspense>
        </ModelBoundary>
      ) : (
        proceduralTrees
      )}
      {ROCK_MODEL_URL ? (
        <ModelBoundary fallback={proceduralRocks}>
          <Suspense fallback={proceduralRocks}>
            <ModelRocks rocks={rocks} />
          </Suspense>
        </ModelBoundary>
      ) : (
        proceduralRocks
      )}
      <Cloud3 position={[-16, 16, -10]} scale={1.4} />
      <Cloud3 position={[18, 19, -4]} scale={1.1} />
      <Cloud3 position={[6, 17, 20]} scale={1.2} />
      <Cloud3 position={[-12, 21, 14]} scale={0.9} />
    </group>
  )
}
