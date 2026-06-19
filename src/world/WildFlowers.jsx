import React, { useMemo, useRef, useLayoutEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Distribuye las flores del modelo Flowers.glb por la zona verde, con la MISMA
// distribución que calcula Scenery para las flores procedurales. El GLB trae 7
// variantes (macizos y flores sueltas) que comparten un único material; cada
// variante se dibuja como un InstancedMesh (barato: ~1 draw call por variante).
const URL = '/Flowers.glb'
const GROUND_Y = 0.72
const TARGET_H = 0.5 // altura objetivo de cada flor/macizo en el mundo
const _o = new THREE.Object3D()

export function WildFlowers({ items }) {
  const { scene } = useGLTF(URL)

  // Extrae cada malla como variante: hornea el transform del nodo (las flores
  // vienen con escala 75–100× dentro del nodo), recentra en xz, apoya la base en
  // y=0 y normaliza la altura a TARGET_H. Conserva el material y las UV (los
  // colores propios del modelo).
  const variants = useMemo(() => {
    scene.updateMatrixWorld(true)
    const out = []
    scene.traverse((o) => {
      if (!o.isMesh) return
      const g = o.geometry.clone()
      g.applyMatrix4(o.matrixWorld) // hornea escala/rotación/posición del nodo
      g.computeBoundingBox()
      const bb = g.boundingBox
      const cx = (bb.min.x + bb.max.x) / 2
      const cz = (bb.min.z + bb.max.z) / 2
      const h = bb.max.y - bb.min.y || 1
      g.translate(-cx, -bb.min.y, -cz)
      const k = TARGET_H / h
      g.scale(k, k, k)
      out.push({ geometry: g, material: o.material })
    })
    return out
  }, [scene])

  // Reparte los items entre las variantes según su índice `v`.
  const groups = useMemo(() => {
    if (!variants.length) return []
    const g = variants.map(() => [])
    for (const it of items) g[it.v % variants.length].push(it)
    return g
  }, [variants, items])

  if (!variants.length) return null

  return (
    <group>
      {variants.map((v, vi) =>
        groups[vi]?.length ? <VariantInstances key={vi} variant={v} group={groups[vi]} /> : null
      )}
    </group>
  )
}

function VariantInstances({ variant, group }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < group.length; i++) {
      const it = group[i]
      _o.position.set(it.position[0], GROUND_Y, it.position[2])
      _o.rotation.set(0, it.rot, 0)
      _o.scale.setScalar(it.scale)
      _o.updateMatrix()
      m.setMatrixAt(i, _o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [group])

  return (
    <instancedMesh
      ref={ref}
      args={[variant.geometry, variant.material, group.length]}
      castShadow={false}
      receiveShadow
      frustumCulled={false}
    />
  )
}

useGLTF.preload(URL)
