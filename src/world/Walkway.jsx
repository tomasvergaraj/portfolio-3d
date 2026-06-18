import React, { useMemo } from 'react'
import { useFBX } from '@react-three/drei'
import * as THREE from 'three'
import { STATIONS, stationPosition } from '../data/stations'

// Camino de roca: enlosa el modelo walkway-stone.fbx a lo largo de cada camino
// (del centro a cada estación). Mide el modelo al cargarlo para auto-escalarlo
// al ancho del camino y repetirlo por su largo.
const WALK_URL = '/walkway-stone.fbx'
const PATH_W = 2.4 // ancho del camino
const PATH_Y = 0.735 // justo sobre la base del camino

export function Walkway() {
  const obj = useFBX(WALK_URL)

  const tiles = useMemo(() => {
    // Mide la huella del modelo.
    const probe = obj.clone(true)
    probe.updateMatrixWorld(true)
    const box = new THREE.Box3().setFromObject(probe)
    const size = new THREE.Vector3()
    box.getSize(size)
    const across = Math.min(size.x, size.z) || 1
    const along = Math.max(size.x, size.z) || 1
    const alongIsX = size.x >= size.z
    const scale = PATH_W / across
    const step = along * scale * 0.98 // leve solape para no dejar juntas
    const baseLift = -box.min.y

    const out = []
    for (const st of STATIONS) {
      const [sx, , sz] = stationPosition(st.angle)
      const len = Math.hypot(sx, sz)
      const dx = sx / len
      const dz = sz / len
      const pathAngle = Math.atan2(dx, dz)
      // El eje "largo" del modelo debe correr a lo largo del camino.
      const rotY = pathAngle - (alongIsX ? Math.PI / 2 : 0)
      const total = len + 1.4
      const count = Math.ceil(total / step)
      for (let i = 0; i < count; i++) {
        const d = i * step + step / 2
        const c = obj.clone(true)
        c.traverse((o) => {
          if (o.isMesh) {
            o.castShadow = false
            o.receiveShadow = true
            o.frustumCulled = false
          }
        })
        out.push({ obj: c, x: dx * d, z: dz * d, rotY, scale, baseLift })
      }
    }
    return out
  }, [obj])

  return (
    <group>
      {tiles.map((t, i) => (
        <group key={i} position={[t.x, PATH_Y, t.z]} rotation={[0, t.rotY, 0]} scale={t.scale}>
          <primitive object={t.obj} position={[0, t.baseLift, 0]} />
        </group>
      ))}
    </group>
  )
}

useFBX.preload(WALK_URL)
