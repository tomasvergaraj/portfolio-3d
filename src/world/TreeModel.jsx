import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'

// ─────────────────────────────────────────────────────────────────────────
// Árbol 3D real (glb estático). Con `null` la escena usa los árboles de
// primitivas. Todas las copias comparten la misma geometría y material del glb
// (no clonamos la malla por instancia): solo cambia su transform.
export const TREE_MODEL_URL = '/arbol.glb' // null para volver a las primitivas

// El glb mide ~1.9 de alto y está centrado en el origen (base en y≈-0.95).
// Escala base para dejarlo a la altura de los árboles low-poly; cada instancia
// la multiplica por su propia variación. Afinado sobre el render.
const BASE_SCALE = 2.3
// Desplazamiento (en unidades locales del modelo) para apoyar la base en el
// origen del grupo: -minY del bbox.
const BASE_LIFT = 0.95

// Extrae geometría + material del glb una sola vez (reutilizables por todas las
// instancias).
function useTreeParts() {
  const { scene } = useGLTF(TREE_MODEL_URL)
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

export function ModelTrees({ trees }) {
  const { geometry, material } = useTreeParts()
  if (!geometry) return null
  return (
    <>
      {trees.map((t, i) => {
        const s = BASE_SCALE * (t.scale ?? 1)
        return (
          <group key={`tm${i}`} position={t.position} rotation={[0, t.rot ?? 0, 0]} scale={s}>
            <mesh geometry={geometry} material={material} castShadow position={[0, BASE_LIFT, 0]} />
          </group>
        )
      })}
    </>
  )
}

if (TREE_MODEL_URL) useGLTF.preload(TREE_MODEL_URL)
