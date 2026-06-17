import React, { Suspense } from 'react'
import { Environment } from '@react-three/drei'
import { Island } from './Island'
import { Sky } from './Sky'
import { Water } from './Water'
import { Scenery } from './Scenery'
import { Player } from './Player'
import { StationMarker } from './StationMarker'
import { Effects } from './Effects'
import { STATIONS, stationPosition } from '../data/stations'

export function Scene({ reducedMotion = false }) {
  return (
    <>
      {/* Domo de cielo con gradiente (cenit → horizonte) y niebla afinada al
          horizonte para que isla y agua fundan suavemente en la distancia. */}
      <color attach="background" args={['#dbeaf3']} />
      <Sky />
      <fog attach="fog" args={['#dbeaf3', 70, 165]} />

      {/* Iluminación analítica: funciona aunque el HDRI no cargue */}
      <hemisphereLight args={['#dcebff', '#9dbe7a', 0.65]} />
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[14, 20, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0005}
        shadow-camera-near={1}
        shadow-camera-far={70}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />

      {/* Iluminación basada en imagen para reflejos suaves; si la red no la
          entrega, la escena ya está iluminada y esto simplemente no aparece. */}
      <Suspense fallback={null}>
        <Environment preset="park" />
      </Suspense>

      <Island />
      <Water animate={!reducedMotion} />
      <Scenery />

      {STATIONS.map((st) => (
        <StationMarker key={st.id} station={st} position={stationPosition(st.angle)} />
      ))}

      <Player />

      <Effects />
    </>
  )
}
