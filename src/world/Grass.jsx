import React, { useMemo, useRef, useLayoutEffect } from 'react'
import { useFrame, useLoader } from '@react-three/fiber'
import { OBJLoader, mergeBufferGeometries } from 'three-stdlib'
import * as THREE from 'three'
import { playerPos } from './playerState'
import { sampleWind } from './wind'

// Matas de pasto (tuft en OBJ, sin textura propia: lo recoloreamos verde) que se
// mecen con el viento y se inclinan apartándose cuando el personaje pasa cerca
// (idea tomada del folio de Bruno Simon).
//
// Rendimiento: todas las matas comparten UN InstancedMesh (1 draw call, 1
// geometría) en vez de un clon por mata. El vaivén/inclinación se escribe por
// instancia cada frame (igual que WildFlowers), componiendo el giro propio de la
// mata con la inclinación de viento/jugador vía cuaterniones.
const GRASS_URL = '/grass2.obj'
const GRASS_H = 0.55
const BEND_RADIUS = 2.4 // distancia a la que el pasto reacciona al personaje
const BEND_MAX = 0.8 // inclinación máxima (rad)

const _box = new THREE.Box3()
const _size = new THREE.Vector3()
const _o = new THREE.Object3D()
const _qLean = new THREE.Quaternion()
const _qSpin = new THREE.Quaternion()
const _eLean = new THREE.Euler()
const _eSpin = new THREE.Euler()

export function Grass({ items }) {
  const obj = useLoader(OBJLoader, GRASS_URL)
  const ref = useRef()

  // Geometría única del tuft: fusiona las submallas del OBJ, la recentra (base en
  // y=0, centro en x/z) y la escala a GRASS_H. Material verde compartido.
  const { geometry, material } = useMemo(() => {
    const src = obj.clone(true)
    src.updateMatrixWorld(true)
    const geos = []
    src.traverse((o) => {
      if (o.isMesh) {
        const g = o.geometry.clone()
        g.applyMatrix4(o.matrixWorld)
        geos.push(g)
      }
    })
    let g = geos.length > 1 ? mergeBufferGeometries(geos, false) : geos[0]
    // El OBJ trae la geometría desplazada lejos del origen; la recentramos para
    // que la base quede en el origen y el vaivén pivote desde el suelo.
    g.computeBoundingBox()
    _box.copy(g.boundingBox)
    const cx = (_box.min.x + _box.max.x) / 2
    const cz = (_box.min.z + _box.max.z) / 2
    g.translate(-cx, -_box.min.y, -cz)
    g.computeBoundingBox()
    g.getSize?.(_size)
    _box.copy(g.boundingBox)
    _box.getSize(_size)
    const k = GRASS_H / (_size.y || 1)
    g.scale(k, k, k)
    g.computeVertexNormals()
    const mat = new THREE.MeshStandardMaterial({
      color: '#6fa14f',
      roughness: 1,
      flatShading: true,
      side: THREE.DoubleSide,
    })
    return { geometry: g, material: mat }
  }, [obj])

  // Estado de inclinación por instancia (suavizado) + giro propio precalculado.
  const state = useMemo(
    () =>
      items.map((it) => {
        _eSpin.set(0, it.rot, 0)
        return { bx: 0, bz: 0, qSpin: new THREE.Quaternion().setFromEuler(_eSpin) }
      }),
    [items]
  )

  // Pose inicial (antes del primer frame).
  useLayoutEffect(() => {
    const m = ref.current
    if (!m) return
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      _o.position.set(it.position[0], it.position[1], it.position[2])
      _o.quaternion.copy(state[i].qSpin)
      _o.scale.setScalar(it.scale)
      _o.updateMatrix()
      m.setMatrixAt(i, _o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  }, [items, state])

  useFrame((st) => {
    const m = ref.current
    if (!m) return
    const t = st.clock.elapsedTime
    const w = sampleWind(t)
    for (let i = 0; i < items.length; i++) {
      const it = items[i]
      const s = state[i]
      // Viento global coherente: onda que viaja en la dirección del viento + una
      // inclinación base hacia donde sopla (misma convención que antes).
      const proj = it.position[0] * w.dirX + it.position[2] * w.dirZ
      const wave = Math.sin(t * 2.1 - proj * 0.4 + it.phase) * 0.08
      const lean = 0.1 + (0.16 + wave) * w.strength
      let bx = -w.dirZ * lean
      let bz = w.dirX * lean
      // Temblor propio para que no queden todas paralelas.
      bx += Math.sin(t * 1.7 + it.phase) * 0.025
      bz += Math.cos(t * 1.4 + it.phase) * 0.02
      // Apartarse del personaje: inclina la copa en dirección contraria.
      const dx = it.position[0] - playerPos.x
      const dz = it.position[2] - playerPos.z
      const dd = Math.hypot(dx, dz)
      if (dd < BEND_RADIUS) {
        const kk = (1 - dd / BEND_RADIUS) * BEND_MAX
        const nx = dx / (dd || 1)
        const nz = dz / (dd || 1)
        bz += nx * kk
        bx += -nz * kk
      }
      s.bx += (bx - s.bx) * 0.18
      s.bz += (bz - s.bz) * 0.18
      // Compone: inclinación (ejes de mundo) ∘ giro propio de la mata.
      _eLean.set(s.bx, 0, s.bz)
      _qLean.setFromEuler(_eLean)
      _o.quaternion.multiplyQuaternions(_qLean, s.qSpin)
      _o.position.set(it.position[0], it.position[1], it.position[2])
      _o.scale.setScalar(it.scale)
      _o.updateMatrix()
      m.setMatrixAt(i, _o.matrix)
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={ref}
      args={[geometry, material, items.length]}
      castShadow={false}
      receiveShadow
      frustumCulled={false}
    />
  )
}

useLoader.preload(OBJLoader, GRASS_URL)
