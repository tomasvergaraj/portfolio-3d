import React, { useMemo, useRef } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three-stdlib'
import * as THREE from 'three'
import { playerPos } from './playerState'
import { sampleWind } from './wind'

// Matas de pasto (tuft en OBJ, sin textura propia: lo recoloreamos verde) que se
// mecen con el viento y se inclinan apartándose cuando el personaje pasa cerca
// (idea tomada del folio de Bruno Simon).
const GRASS_URL = '/grass2.obj'
const GROUND_Y = 0.72
const GRASS_H = 0.55
const BEND_RADIUS = 2.4 // distancia a la que el pasto reacciona al personaje
const BEND_MAX = 0.8 // inclinación máxima (rad)

const _box = new THREE.Box3()
const _size = new THREE.Vector3()

export function Grass({ items }) {
  const obj = useLoader(OBJLoader, GRASS_URL)

  // Fuente única: el OBJ recentrado, recoloreado y medido para auto-escalar.
  const { source, baseScale, baseLift } = useMemo(() => {
    const tuft = obj.clone(true)
    const mat = new THREE.MeshStandardMaterial({
      color: '#6fa14f',
      roughness: 1,
      flatShading: true,
      side: THREE.DoubleSide,
    })
    // El OBJ trae su geometría desplazada muy lejos del origen (x≈900, z≈-1700).
    // Si no la recentramos, la rotación de viento pivotea en un arco enorme y la
    // mata se ve subiendo/bajando en vez de mecerse. La movemos para que su base
    // quede sobre el origen (centro en x/z, base en y=0).
    tuft.updateMatrixWorld(true)
    _box.setFromObject(tuft)
    const cx = (_box.min.x + _box.max.x) / 2
    const cz = (_box.min.z + _box.max.z) / 2
    const minY = _box.min.y
    tuft.traverse((o) => {
      if (o.isMesh) {
        o.material = mat
        o.geometry = o.geometry.clone()
        o.geometry.translate(-cx, -minY, -cz)
      }
    })
    _box.setFromObject(tuft)
    _box.getSize(_size)
    return { source: tuft, baseScale: GRASS_H / (_size.y || 1), baseLift: -_box.min.y }
  }, [obj])

  // Un clon por mata (comparte geometría/material).
  const clones = useMemo(
    () =>
      items.map(() => {
        const c = source.clone(true)
        c.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = false
            o.receiveShadow = true
            o.frustumCulled = false
          }
        })
        return c
      }),
    [source, items]
  )

  const refs = useRef([])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const w = sampleWind(t)
    for (let i = 0; i < items.length; i++) {
      const g = refs.current[i]
      if (!g) continue
      const it = items[i]
      // Viento global coherente: una onda que viaja en la dirección del viento
      // (la fase depende de la posición proyectada sobre ese eje, así la racha
      // "barre" el campo) más una inclinación base hacia donde sopla. La copa se
      // tumba en dirección (dirX, dirZ): bz sigue a dirX, bx sigue a -dirZ (igual
      // convención que el apartarse del personaje, más abajo).
      const proj = it.position[0] * w.dirX + it.position[2] * w.dirZ
      const wave = Math.sin(t * 2.1 - proj * 0.4 + it.phase) * 0.08
      const lean = 0.1 + (0.16 + wave) * w.strength
      let bx = -w.dirZ * lean
      let bz = w.dirX * lean
      // Pequeño temblor propio para que las matas no queden perfectamente
      // paralelas entre sí en una racha fuerte.
      bx += Math.sin(t * 1.7 + it.phase) * 0.025
      bz += Math.cos(t * 1.4 + it.phase) * 0.02
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

useLoader.preload(OBJLoader, GRASS_URL)
