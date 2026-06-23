import React, { useMemo, useRef, useLayoutEffect } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleWind } from './wind'

// Distribuye las flores del modelo Flowers.glb por la zona verde, con la MISMA
// distribución que calcula Scenery para las flores procedurales. El GLB trae 7
// variantes (macizos y flores sueltas) que comparten un único material; cada
// variante se dibuja como un InstancedMesh (barato: ~1 draw call por variante).
const URL = '/Flowers.glb'
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

  // Pose inicial (antes del primer frame, sin tirón ni flor gigante en el origen).
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < group.length; i++) {
      const it = group[i]
      _o.position.set(it.position[0], it.position[1], it.position[2])
      _o.rotation.set(0, it.rot, 0)
      _o.scale.setScalar(it.scale)
      _o.updateMatrix()
      m.setMatrixAt(i, _o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [group])

  // Vaivén con el viento global: las flores se inclinan hacia donde sopla, con
  // una onda que viaja por el campo (igual criterio que el pasto). Pivotan desde
  // su base (el origen de cada instancia está en el suelo). `it.rot` hace de fase.
  useFrame((state) => {
    const m = ref.current
    if (!m) return
    const t = state.clock.elapsedTime
    const w = sampleWind(t)
    const lean = 0.05 + 0.1 * w.strength
    for (let i = 0; i < group.length; i++) {
      const it = group[i]
      const proj = it.position[0] * w.dirX + it.position[2] * w.dirZ
      const wave = Math.sin(t * 1.9 - proj * 0.4 + it.rot) * 0.045 * (0.5 + w.strength)
      const k = lean + wave
      _o.position.set(it.position[0], it.position[1], it.position[2])
      _o.rotation.set(-w.dirZ * k, it.rot, w.dirX * k)
      _o.scale.setScalar(it.scale)
      _o.updateMatrix()
      m.setMatrixAt(i, _o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

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
