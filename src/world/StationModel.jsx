import React, { useMemo, useLayoutEffect, useState, useEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// ─────────────────────────────────────────────────────────────────────────
// Monumento 3D real por estación. Deja un glb en public/ con el id de la
// estación: sobre.glb, proyectos.glb, stack.glb, experiencia.glb, contacto.glb.
// Si el archivo no existe, StationMarker cae al monumento de primitivas.
//
// El modelo se auto-ajusta: se escala a una altura objetivo y se apoya la base
// en el suelo, así no hay que afinar escala/posición por cada uno.
export const stationModelUrl = (id) => `/${id}.glb`

// Comprueba (una vez, sin ruido en consola) si existe el glb de la estación.
// No basta con el 200: en dev/SPA el servidor responde index.html para rutas
// inexistentes, así que verificamos la firma del glb ("glTF") en los primeros
// bytes. Así solo cargamos los que el usuario ya dejó en public/.
const _existsCache = new Map()
async function probeGlb(url) {
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-3' } })
    if (!r.ok) return false
    const sig = new TextDecoder().decode((await r.arrayBuffer()).slice(0, 4))
    return sig === 'glTF'
  } catch {
    return false
  }
}
export function useStationModelExists(id) {
  const url = stationModelUrl(id)
  const [exists, setExists] = useState(() => _existsCache.get(url) ?? null)
  useEffect(() => {
    if (_existsCache.has(url)) return
    let live = true
    probeGlb(url).then((ok) => { _existsCache.set(url, ok); if (live) setExists(ok) })
    return () => { live = false }
  }, [url])
  return exists
}

const TARGET_H = 3.2 // alto objetivo del monumento (u)
const GROUND_Y = 0.72 // nivel de la tapa de pasto

const _box = new THREE.Box3()
const _size = new THREE.Vector3()

export function StationModel({ id }) {
  const { scene } = useGLTF(stationModelUrl(id))
  const model = useMemo(() => scene.clone(true), [scene])

  const { scale, lift } = useMemo(() => {
    _box.setFromObject(model)
    _box.getSize(_size)
    const h = _size.y || 1
    const s = TARGET_H / h
    // Apoya la base (min.y del modelo, ya escalada) sobre el suelo.
    return { scale: s, lift: GROUND_Y - _box.min.y * s }
  }, [model])

  useLayoutEffect(() => {
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true
        o.receiveShadow = false
        o.frustumCulled = false
      }
    })
  }, [model])

  return <primitive object={model} scale={scale} position={[0, lift, 0]} />
}
