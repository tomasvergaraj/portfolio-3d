import React, { useRef, useLayoutEffect } from 'react'
import * as THREE from 'three'

// Flores silvestres dispersas por la zona verde: pequeños capullos de colores que
// salpican el pasto y le dan vida y variedad cromática (la isla era muy
// monocromáticamente verde). Un único instancedMesh con color por instancia, así
// que es barato (una draw call). Estáticas: no necesitan animación propia.
// Pequeño levante sobre el suelo para que el capullo no se hunda en el pasto.
const LIFT = 0.06
const COLORS = ['#f2789f', '#ffd23f', '#ffffff', '#b08be6', '#ff7a59', '#7ec8ff']
const _o = new THREE.Object3D()
const _c = new THREE.Color()

export function Flowers({ items }) {
  const ref = useRef()

  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < items.length; i++) {
      const f = items[i]
      _o.position.set(f.position[0], f.position[1] + LIFT + f.h, f.position[2])
      _o.rotation.set(0, f.rot, 0)
      _o.scale.set(f.s, f.s * 0.7, f.s) // capullo ligeramente achatado
      _o.updateMatrix()
      m.setMatrixAt(i, _o.matrix)
      m.setColorAt(i, _c.set(COLORS[f.c]))
    }
    m.instanceMatrix.needsUpdate = true
    if (m.instanceColor) m.instanceColor.needsUpdate = true
  }, [items])

  return (
    <instancedMesh ref={ref} args={[undefined, undefined, items.length]} frustumCulled={false}>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial roughness={0.7} flatShading />
    </instancedMesh>
  )
}

export const FLOWER_COLOR_COUNT = COLORS.length
