import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'

// ─────────────────────────────────────────────────────────────────────────
// Roca 3D real (glb estático). Con `null` la escena usa las rocas de
// primitivas. Todas las copias comparten geometría y material del glb.
export const ROCK_MODEL_URL = '/roca.glb' // null para volver a las primitivas

// El glb mide ~1.72 × 1.24 × 2.0 y su base está en y≈-0.62. Escala base por
// instancia (cada roca la multiplica por su variación). Afinado sobre el render.
const BASE_SCALE = 0.55
// Apoya la base (un poco hundida para que parezca asentada en el terreno).
const BASE_LIFT = 0.48
// Nivel del suelo (tapa de pasto).
const GROUND_Y = 0.72

function useRockParts() {
  const { scene } = useGLTF(ROCK_MODEL_URL)
  return useMemo(() => {
    let geometry = null
    let material = null
    scene.traverse((o) => {
      if (o.isMesh && !geometry) {
        geometry = o.geometry
        material = o.material
      }
    })
    if (material) material.roughness = 1
    return { geometry, material }
  }, [scene])
}

export function ModelRocks({ rocks }) {
  const { geometry, material } = useRockParts()
  if (!geometry) return null
  return (
    <>
      {rocks.map((r, i) => {
        const s = BASE_SCALE * (r.scale ?? 1)
        const [x, , z] = r.position
        return (
          <group key={`rm${i}`} position={[x, GROUND_Y, z]} rotation={[0, r.rot ?? 0, 0]} scale={s}>
            <mesh geometry={geometry} material={material} castShadow position={[0, BASE_LIFT, 0]} />
          </group>
        )
      })}
    </>
  )
}

if (ROCK_MODEL_URL) useGLTF.preload(ROCK_MODEL_URL)
