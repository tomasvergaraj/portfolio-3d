import React, { useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame, useLoader } from '@react-three/fiber'
import { OBJLoader } from 'three-stdlib'
import * as THREE from 'three'
import { playerPos } from './playerState'

// Matas de pasto que se mecen con el viento y se inclinan apartándose cuando el
// personaje pasa cerca (idea tomada del folio de Bruno Simon). Dos variantes:
// el GLB de matas y un "tuft" en OBJ (sin textura propia: lo recoloreamos verde).
const GRASS_URL = '/Grass.glb'
const GRASS2_URL = '/grass2.obj'
const GROUND_Y = 0.72
const GRASS_H = 0.5
const GRASS2_H = 0.55
const BEND_RADIUS = 2.4 // distancia a la que el pasto reacciona al personaje
const BEND_MAX = 0.8 // inclinación máxima (rad)

const _box = new THREE.Box3()
const _size = new THREE.Vector3()

// Mide la huella de un modelo para auto-escalarlo a `targetH` y apoyarlo al suelo.
function measure(obj, targetH) {
  const c = obj.clone(true)
  c.updateMatrixWorld(true)
  _box.setFromObject(c)
  _box.getSize(_size)
  return { baseScale: targetH / (_size.y || 1), baseLift: -_box.min.y }
}

export function Grass({ items }) {
  const { scene } = useGLTF(GRASS_URL)
  const obj = useLoader(OBJLoader, GRASS2_URL)

  // Una fuente por variante: { source, baseScale, baseLift }.
  const sources = useMemo(() => {
    const v0 = { source: scene, ...measure(scene, GRASS_H) }
    // grass2.obj viene sin material utilizable: le ponemos un verde low-poly y
    // lo hacemos de doble cara (son planos cruzados).
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
    const v1 = { source: tuft, ...measure(tuft, GRASS2_H) }
    return [v0, v1]
  }, [scene, obj])

  // Un clon por mata (comparte geometría/material).
  const clones = useMemo(
    () =>
      items.map((it) => {
        const c = sources[it.variant || 0].source.clone(true)
        c.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = false
            o.receiveShadow = true
            o.frustumCulled = false
          }
        })
        return c
      }),
    [sources, items]
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
      {items.map((it, i) => {
        const src = sources[it.variant || 0]
        return (
          // Exterior: posición + escala (sin giro, para que la inclinación use ejes
          // de mundo). Intermedio (ref): inclinación viento/personaje. Interior:
          // giro propio de la mata.
          <group key={i} position={[it.position[0], GROUND_Y, it.position[2]]} scale={src.baseScale * it.scale}>
            <group ref={(el) => (refs.current[i] = el)}>
              <primitive object={clones[i]} rotation={[0, it.rot, 0]} position={[0, src.baseLift, 0]} />
            </group>
          </group>
        )
      })}
    </>
  )
}

useGLTF.preload(GRASS_URL)
useLoader.preload(OBJLoader, GRASS2_URL)
