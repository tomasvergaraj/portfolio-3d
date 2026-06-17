import React, { useLayoutEffect, useMemo } from 'react'
import { useFBX, useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────
// Avatar 3D real (Mixamo u otro). Para activarlo, deja un modelo válido en
// `public/` y pon su ruta aquí. Soporta:
//   • glTF/GLB  → recomendado (ligero; usa useGLTF)
//   • FBX 7.x   → binario o ASCII (useFBX). OJO: el FBXLoader de three NO
//                 soporta FBX 6100 (versión antigua). Re-descarga desde
//                 Mixamo como "FBX Binary" (es 7.x) o convierte a .glb.
//
// Con `null` el Player usa el avatar de primitivas (sin cargar nada).
export const AVATAR_MODEL_URL = null // ej. '/character.glb' o '/character.fbx'

// Mixamo exporta en centímetros (~180 u); escalamos a ~1.8 u. Para un .glb en
// metros usa SCALE ≈ 1. Ajusta tras ver el render.
const SCALE = AVATAR_MODEL_URL && /\.glb|\.gltf$/i.test(AVATAR_MODEL_URL) ? 1 : 0.0105
const IS_GLTF = !!AVATAR_MODEL_URL && /\.glb|\.gltf$/i.test(AVATAR_MODEL_URL)

function tuneAndPose(model) {
  model.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true
      o.receiveShadow = false
      o.frustumCulled = false
      const mats = Array.isArray(o.material) ? o.material : [o.material]
      for (const m of mats) {
        if (!m) continue
        m.roughness = 0.85
        m.metalness = 0
        m.side = THREE.FrontSide
      }
    }
  })
  // Pose-A: baja los brazos desde la pose-T (si el rig es de Mixamo y no hay
  // animación). Inofensivo si los huesos no existen.
  const lower = (name, sign) => {
    const bone = model.getObjectByName(name)
    if (bone) bone.rotation.z += sign * 1.05
  }
  lower('mixamorigLeftArm', 1)
  lower('mixamorigRightArm', -1)
}

function GltfAvatar() {
  const { scene } = useGLTF(AVATAR_MODEL_URL)
  const model = useMemo(() => scene.clone(true), [scene])
  useLayoutEffect(() => tuneAndPose(model), [model])
  return <primitive object={model} scale={SCALE} position={[0, 0, 0]} rotation={[0, Math.PI, 0]} />
}

function FbxAvatar() {
  const fbx = useFBX(AVATAR_MODEL_URL)
  const model = useMemo(() => fbx.clone(true), [fbx])
  useLayoutEffect(() => tuneAndPose(model), [model])
  return <primitive object={model} scale={SCALE} position={[0, 0.2, 0]} rotation={[0, Math.PI, 0]} />
}

export function AvatarModel() {
  return IS_GLTF ? <GltfAvatar /> : <FbxAvatar />
}
