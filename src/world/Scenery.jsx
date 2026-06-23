import React, { useMemo, useRef, Suspense } from 'react'
import { Float } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { STATIONS, stationPosition } from '../data/stations'
import { sampleWind } from './wind'
import { Instance, preloadModel } from './props'
import { ModelBoundary } from './ModelBoundary'
import { Grass } from './Grass'
import { Flowers, FLOWER_COLOR_COUNT } from './Flowers'
import { WildFlowers } from './WildFlowers'
import { sampleHeight } from './terrain'

const TREE_URLS = ['/Tree.glb', '/Tree2.glb']
const ROCK_URL = '/Resource_Rock_1.fbx'
const TREE_H = 3.6
const ROCK_H = 0.9

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

// Árbol de primitivas: fallback si los glb no cargan.
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

// Roca de primitivas: fallback si el fbx no carga.
function ProceduralRock({ position, scale = 1 }) {
  return (
    <mesh castShadow position={position} scale={scale} rotation={[0.3, 0.8, 0.1]}>
      <dodecahedronGeometry args={[0.6, 0]} />
      <meshStandardMaterial color="#9aa0a6" roughness={1} flatShading />
    </mesh>
  )
}

const CLOUD_DRIFT_RANGE = 48 // se aleja esto de su origen y reaparece por el otro lado

function Cloud3({ position, scale = 1 }) {
  const ref = useRef()
  // Deriva con el viento global (mismo vector que el resto del mundo); al salir
  // del rango reaparece por el lado opuesto. El bamboleo vertical lo da Float.
  useFrame((state, dt) => {
    if (!ref.current) return
    const w = sampleWind(state.clock.elapsedTime)
    const d = Math.min(dt, 0.05)
    const p = ref.current.position
    p.x += w.dirX * w.strength * 0.7 * d
    p.z += w.dirZ * w.strength * 0.7 * d
    if (p.x - position[0] > CLOUD_DRIFT_RANGE) p.x -= CLOUD_DRIFT_RANGE * 2
    else if (p.x - position[0] < -CLOUD_DRIFT_RANGE) p.x += CLOUD_DRIFT_RANGE * 2
    if (p.z - position[2] > CLOUD_DRIFT_RANGE) p.z -= CLOUD_DRIFT_RANGE * 2
    else if (p.z - position[2] < -CLOUD_DRIFT_RANGE) p.z += CLOUD_DRIFT_RANGE * 2
  })
  return (
    <group ref={ref} position={position}>
      <Float speed={1.1} rotationIntensity={0} floatIntensity={0.6}>
        <group scale={scale}>
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
    </group>
  )
}

// Punto donde aparece el personaje al entrar (ver Player.jsx). Mantenemos esta
// zona despejada para que ningún árbol tape al avatar en la intro.
const SPAWN = [0, 6]
const SPAWN_CLEAR = 6

export function Scenery() {
  const { trees, rocks, grass, flowers } = useMemo(() => {
    const rnd = mulberry32(20240617)
    const stationAngles = STATIONS.map((s) => s.angle)
    const trees = []
    const rocks = []
    const grass = []
    const flowers = []

    const farFromStations = (x, z, min = 4.2) => {
      for (const a of stationAngles) {
        const [sx, , sz] = stationPosition(a)
        if (Math.hypot(x - sx, z - sz) < min) return false
      }
      return true
    }

    const farFromSpawn = (x, z) => Math.hypot(x - SPAWN[0], z - SPAWN[1]) > SPAWN_CLEAR

    // Caminos de roca: van del centro a cada estación. Un punto está "sobre el
    // camino" si su distancia perpendicular a alguna línea radial es menor que el
    // medio-ancho (+ margen) y cae dentro del largo del camino. Lo usamos para no
    // colocar vegetación ni rocas encima de los caminos enlosados.
    const onPath = (x, z) => {
      for (const a of stationAngles) {
        const [sx, , sz] = stationPosition(a)
        const len = Math.hypot(sx, sz) || 1
        const dx = sx / len
        const dz = sz / len
        const along = x * dx + z * dz
        const perp = Math.abs(x * dz - z * dx)
        if (along > -1 && along < len + 1.4 && perp < 1.7) return true
      }
      return false
    }

    // Distribución estratificada: un árbol por sector angular para que queden
    // repartidos por todo el anillo en vez de amontonarse en una zona.
    const TREE_COUNT = 10
    const sector = (Math.PI * 2) / TREE_COUNT
    const baseRot = rnd() * Math.PI * 2
    for (let i = 0; i < TREE_COUNT; i++) {
      let placed = false
      for (let attempt = 0; attempt < 24 && !placed; attempt++) {
        const a = baseRot + sector * (i + 0.15 + rnd() * 0.7)
        const r = 8 + rnd() * 11
        const x = Math.cos(a) * r
        const z = Math.sin(a) * r
        if (!farFromStations(x, z)) continue
        if (!farFromSpawn(x, z)) continue
        if (onPath(x, z)) continue
        if (Math.hypot(x, z) < 6) continue
        trees.push({
          position: [x, sampleHeight(x, z), z],
          scale: 0.8 + rnd() * 0.5,
          rot: rnd() * Math.PI * 2,
          url: TREE_URLS[rnd() < 0.5 ? 0 : 1],
        })
        placed = true
      }
    }

    // Rocas: repartidas por sectores y fuera de caminos / estaciones / centro.
    const ROCK_COUNT = 11
    const rsector = (Math.PI * 2) / ROCK_COUNT
    const rbase = rnd() * Math.PI * 2
    for (let i = 0; i < ROCK_COUNT; i++) {
      for (let attempt = 0; attempt < 24; attempt++) {
        const a = rbase + rsector * (i + 0.1 + rnd() * 0.8)
        const r = 6 + rnd() * 13
        const x = Math.cos(a) * r
        const z = Math.sin(a) * r
        if (onPath(x, z)) continue
        if (!farFromStations(x, z, 3.6)) continue
        if (Math.hypot(x, z) < 5) continue
        rocks.push({ position: [x, sampleHeight(x, z), z], scale: 0.6 + rnd() * 0.9, rot: rnd() * Math.PI * 2 })
        break
      }
    }

    // Matas de pasto (grass2.obj) dispersas por la zona verde, sin pisar caminos,
    // el centro ni las estaciones.
    let guard = 0
    while (grass.length < 110 && guard < 3500) {
      guard++
      const a = rnd() * Math.PI * 2
      const r = 4.5 + rnd() * 16
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      if (onPath(x, z)) continue
      if (Math.hypot(x, z) < 4) continue
      if (!farFromStations(x, z, 2.6)) continue
      grass.push({
        position: [x, sampleHeight(x, z), z],
        scale: 0.7 + rnd() * 0.7,
        rot: rnd() * Math.PI * 2,
        phase: rnd() * Math.PI * 2,
      })
    }

    // Flores silvestres: salpican la zona verde con color, con las mismas
    // restricciones que el pasto (fuera de caminos, centro y estaciones).
    let fguard = 0
    while (flowers.length < 72 && fguard < 2500) {
      fguard++
      const a = rnd() * Math.PI * 2
      const r = 4.5 + rnd() * 16
      const x = Math.cos(a) * r
      const z = Math.sin(a) * r
      if (onPath(x, z)) continue
      if (Math.hypot(x, z) < 4) continue
      if (!farFromStations(x, z, 2.4)) continue
      flowers.push({
        position: [x, sampleHeight(x, z), z],
        rot: rnd() * Math.PI * 2,
        v: Math.floor(rnd() * 7), // variante del modelo Flowers.glb (7 mallas)
        scale: 0.7 + rnd() * 0.6, // escala del modelo (alto ~0.35–0.65)
        // campos para el fallback procedural (Flowers.jsx) si el GLB no carga:
        s: 0.1 + rnd() * 0.07,
        h: 0.06 + rnd() * 0.12,
        c: Math.floor(rnd() * FLOWER_COLOR_COUNT),
      })
    }

    return { trees, rocks, grass, flowers }
  }, [])

  const proceduralTrees = (
    <>
      {trees.map((t, i) => (
        <ProceduralTree key={`t${i}`} position={t.position} scale={t.scale} />
      ))}
    </>
  )
  const proceduralRocks = (
    <>
      {rocks.map((r, i) => (
        <ProceduralRock key={`r${i}`} position={r.position} scale={r.scale} />
      ))}
    </>
  )

  return (
    <group>
      {/* Árboles (dos variantes) */}
      <ModelBoundary fallback={proceduralTrees}>
        <Suspense fallback={proceduralTrees}>
          {trees.map((t, i) => (
            <Instance key={`t${i}`} url={t.url} position={t.position} targetH={TREE_H} scaleMul={t.scale} rot={t.rot} sway={0.05} groundY={t.position[1]} />
          ))}
        </Suspense>
      </ModelBoundary>

      {/* Rocas */}
      <ModelBoundary fallback={proceduralRocks}>
        <Suspense fallback={proceduralRocks}>
          {rocks.map((r, i) => (
            <Instance key={`r${i}`} url={ROCK_URL} position={r.position} targetH={ROCK_H} scaleMul={r.scale} rot={r.rot} groundY={r.position[1]} />
          ))}
        </Suspense>
      </ModelBoundary>

      {/* Matas de pasto reactivas (viento + se apartan del personaje) */}
      <ModelBoundary fallback={null}>
        <Suspense fallback={null}>
          <Grass items={grass} />
        </Suspense>
      </ModelBoundary>

      {/* Flores silvestres (modelo Flowers.glb, 7 variantes) salpicadas por la
          zona verde. Si el GLB no carga, caen a los capullos procedurales. */}
      <ModelBoundary fallback={<Flowers items={flowers} />}>
        <Suspense fallback={<Flowers items={flowers} />}>
          <WildFlowers items={flowers} />
        </Suspense>
      </ModelBoundary>

      <Cloud3 position={[-16, 16, -10]} scale={1.4} />
      <Cloud3 position={[18, 19, -4]} scale={1.1} />
      <Cloud3 position={[6, 17, 20]} scale={1.2} />
      <Cloud3 position={[-12, 21, 14]} scale={0.9} />
    </group>
  )
}

preloadModel(TREE_URLS[0])
preloadModel(TREE_URLS[1])
preloadModel(ROCK_URL)
