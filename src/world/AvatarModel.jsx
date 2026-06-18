import React, { useRef, useEffect, useLayoutEffect, useMemo } from 'react'
import { useFBX, useGLTF, useAnimations } from '@react-three/drei'
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
export const AVATAR_MODEL_URL = '/character_inactive.fbx' // ej. '/character.glb'

// Mixamo exporta en centímetros (~180 u); escalamos a ~1.8 u. Para un .glb en
// metros usa SCALE ≈ 1. Ajustado sobre el render.
const IS_GLTF = !!AVATAR_MODEL_URL && /\.glb|\.gltf$/i.test(AVATAR_MODEL_URL)
const SCALE = IS_GLTF ? 1 : 0.0105
// Apoyo en el suelo: este rig tiene el pivote a la altura de la cadera (los pies
// quedan ~0.55 bajo el origen ya escalado) y el grupo del avatar está ~0.2 bajo
// la tapa de pasto. Subimos para que los pies toquen el suelo. (Tuneado sobre el
// render; para un .glb con pies en el origen bastaría ~0.2.)
const FOOT_Y = 0.75

function tuneMaterials(model) {
  model.traverse((o) => {
    if (o.isMesh || o.isSkinnedMesh) {
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
}

function GltfAvatar() {
  const { scene } = useGLTF(AVATAR_MODEL_URL)
  const model = useMemo(() => scene.clone(true), [scene])
  useLayoutEffect(() => tuneMaterials(model), [model])
  return <primitive object={model} scale={SCALE} position={[0, FOOT_Y, 0]} rotation={[0, Math.PI, 0]} />
}

function FbxAvatar() {
  const ref = useRef()
  // Una sola instancia: usamos el objeto directo (sin clonar el skinned mesh).
  const fbx = useFBX(AVATAR_MODEL_URL)
  const { actions } = useAnimations(fbx.animations, ref)

  useLayoutEffect(() => tuneMaterials(fbx), [fbx])

  useEffect(() => {
    // Reproduce el clip de inactivo (Mixamo exporta una sola "take").
    const a = Object.values(actions)[0]
    if (!a) return
    a.reset().setLoop(THREE.LoopRepeat, Infinity).play()
    return () => a.stop()
  }, [actions])

  return (
    <group ref={ref}>
      <primitive object={fbx} scale={SCALE} position={[0, FOOT_Y, 0]} rotation={[0, Math.PI, 0]} />
    </group>
  )
}

export function AvatarModel() {
  return IS_GLTF ? <GltfAvatar /> : <FbxAvatar />
}

if (AVATAR_MODEL_URL) {
  if (IS_GLTF) useGLTF.preload(AVATAR_MODEL_URL)
  else useFBX.preload(AVATAR_MODEL_URL)
}
