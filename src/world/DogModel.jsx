import React, { useLayoutEffect, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────
// Mascota 3D real (glb estático en public/). Con `null` el Player usa el perro
// de primitivas. El modelo no trae animación; la marcha (balanceo y giro) la
// pone el Player de forma procedural sobre el grupo que lo contiene.
export const DOG_MODEL_URL = '/dog.glb' // null para volver a las primitivas

// El glb mide ~1.15(x) × 1.64(y) × 2.0(z) y está centrado en el origen.
// Escala para dejar al perro como un compañero ~0.9 de alto.
const SCALE = 0.6
// Sus patas quedan en y ≈ -0.82·SCALE; lo subimos para apoyarlo sobre el
// origen del grupo (que el Player sitúa al nivel del suelo).
const FEET_LIFT = 0.82 * SCALE
// El grupo orienta el hocico hacia +x (la marcha resta π/2 al rumbo). El glb
// mira a -x de fábrica, así que giramos +π/2 para que el hocico apunte al avance.
const FACE_OFFSET = Math.PI / 2

function tune(model) {
  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true
      o.receiveShadow = false
      o.frustumCulled = false
    }
  })
}

export function DogModel() {
  const { scene } = useGLTF(DOG_MODEL_URL)
  const model = useMemo(() => scene.clone(true), [scene])
  useLayoutEffect(() => tune(model), [model])
  return (
    <primitive
      object={model}
      scale={SCALE}
      position={[0, FEET_LIFT, 0]}
      rotation={[0, FACE_OFFSET, 0]}
    />
  )
}

if (DOG_MODEL_URL) useGLTF.preload(DOG_MODEL_URL)
