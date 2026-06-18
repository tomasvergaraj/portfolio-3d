import React, { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { playerPos } from './playerState'

// Matas de pasto que se mecen con el viento y se inclinan apartándose cuando el
// personaje pasa cerca (idea tomada del folio de Bruno Simon).
const GRASS_URL = '/Grass.glb'
const GROUND_Y = 0.72
const GRASS_H = 0.5
const BEND_RADIUS = 2.4 // distancia a la que el pasto reacciona al personaje
const BEND_MAX = 0.8 // inclinación máxima (rad)

const _box = new THREE.Box3()
const _size = new THREE.Vector3()

export function Grass({ items }) {
  const { scene } = useGLTF(GRASS_URL)

  const { baseScale, baseLift } = useMemo(() => {
    const c = scene.clone(true)
    c.updateMatrixWorld(true)
    _box.setFromObject(c)
    _box.getSize(_size)
    return { baseScale: GRASS_H / (_size.y || 1), baseLift: -_box.min.y }
  }, [scene])

  // Un clon por mata (comparte geometría/material).
  const clones = useMemo(
    () =>
      items.map(() => {
        const c = scene.clone(true)
        c.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = false
            o.receiveShadow = true
            o.frustumCulled = false
          }
        })
        return c
      }),
    [scene, items]
  )

  const refs = useRef([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    for (let i = 0; i < items.length; i++) {
      const g = refs.current[i]
      if (!g) continue
      const it = items[i]
      // Viento: vaivén suave desfasado por mata.
      let bx = Math.sin(t * 1.5 + it.phase) * 0.07
      let bz = Math.cos(t * 1.2 + it.phase) * 0.05
      // Apartarse del personaje: inclina la copa en dirección contraria.
      const dx = it.position[0] - playerPos.x
      const dz = it.position[2] - playerPos.z
      const d = Math.hypot(dx, dz)
      if (d < BEND_RADIUS) {
        const k = (1 - d / BEND_RADIUS) * BEND_MAX
        const nx = dx / (d || 1)
        const nz = dz / (d || 1)
        // Inclinar lejos del jugador (tumbar la copa hacia +n).
        bz += nx * k
        bx += -nz * k
      }
      g.rotation.x += (bx - g.rotation.x) * 0.18
      g.rotation.z += (bz - g.rotation.z) * 0.18
    }
  })

  return (
    <>
      {items.map((it, i) => (
        // Exterior: posición + escala (sin giro, para que la inclinación use ejes
        // de mundo). Intermedio (ref): inclinación viento/personaje. Interior:
        // giro propio de la mata.
        <group key={i} position={[it.position[0], GROUND_Y, it.position[2]]} scale={baseScale * it.scale}>
          <group ref={(el) => (refs.current[i] = el)}>
            <primitive object={clones[i]} rotation={[0, it.rot, 0]} position={[0, baseLift, 0]} />
          </group>
        </group>
      ))}
    </>
  )
}

useGLTF.preload(GRASS_URL)
