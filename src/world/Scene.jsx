import React, { Suspense, useRef } from 'react'
import { Environment, Sparkles } from '@react-three/drei'
import { Island } from './Island'
import { Walkway } from './Walkway'
import { Instance } from './props'
import { ModelBoundary } from './ModelBoundary'
import { Sky } from './Sky'
import { Water } from './Water'
import { FountainSpray } from './FountainSpray'
import { Scenery } from './Scenery'
import { Player } from './Player'
import { FootTrail } from './FootTrail'
import { StationMarker } from './StationMarker'
import { Effects } from './Effects'
import { Leaves, DayNight, Butterflies, Fireflies, Birds } from './Ambiance'
import { Dust } from './Dust'
import { STATIONS, stationPosition } from '../data/stations'

export function Scene({ reducedMotion = false }) {
  const keyLight = useRef()
  return (
    <>
      {/* Domo de cielo con gradiente (cenit → horizonte) y niebla afinada al
          horizonte para que isla y agua fundan suavemente en la distancia. */}
      <color attach="background" args={['#dbeaf3']} />
      <Sky />
      <fog attach="fog" args={['#dbeaf3', 70, 165]} />

      {/* Iluminación analítica con dirección y temperatura: funciona aunque el
          HDRI no cargue. Key cálida (sol) + relleno frío opuesto que modela las
          formas low-poly; ambiente bajo para conservar contraste. */}
      <hemisphereLight args={['#dcebff', '#9dbe7a', 0.5]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        ref={keyLight}
        position={[14, 20, 8]}
        intensity={1.7}
        color="#fff1d4"
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
      {/* Relleno frío desde el lado opuesto: separa las siluetas del fondo */}
      <directionalLight position={[-12, 9, -10]} intensity={0.45} color="#bcd7ff" />

      {/* Iluminación basada en imagen para reflejos suaves; si la red no la
          entrega, la escena ya está iluminada y esto simplemente no aparece. */}
      <Suspense fallback={null}>
        <Environment preset="park" />
      </Suspense>

      <Island />

      {/* Camino de roca enlosado sobre la base de los caminos */}
      <ModelBoundary fallback={null}>
        <Suspense fallback={null}>
          <Walkway />
        </Suspense>
      </ModelBoundary>

      {/* Fuente en el centro de la plaza, con su chorro de agua */}
      <ModelBoundary fallback={null}>
        <Suspense fallback={null}>
          <Instance url="/Fountain.obj" position={[0, 0, 0]} targetH={2.6} />
        </Suspense>
      </ModelBoundary>
      <FountainSpray position={[0, 0, 0]} reducedMotion={reducedMotion} />

      {/* Sin charco de sombra de contacto global: dejaba una "marca" oscura que
          seguía al avatar y al perro por el suelo. El asentado lo dan ahora las
          sombras direccionales reales (la isla y los caminos las reciben). */}

      <Water animate={!reducedMotion} />
      <Scenery />

      {STATIONS.map((st) => (
        <StationMarker key={st.id} station={st} position={stationPosition(st.angle)} />
      ))}

      <Player reducedMotion={reducedMotion} />
      <FootTrail reducedMotion={reducedMotion} />
      <Dust />

      {/* Motas que flotan en el aire y captan la luz: dan vida y un aire cálido
          al mundo. Se congelan con prefers-reduced-motion. */}
      <Sparkles
        count={42}
        scale={[44, 12, 44]}
        position={[0, 6, 0]}
        size={3}
        speed={reducedMotion ? 0 : 0.35}
        opacity={0.5}
        color="#fff3d6"
      />

      {/* Hojas que caen y ciclo de luz suave (día/noche) */}
      <Leaves reducedMotion={reducedMotion} />
      {!reducedMotion && <DayNight lightRef={keyLight} />}

      {/* Criaturas ambientales (se congelan con prefers-reduced-motion) */}
      {!reducedMotion && (
        <>
          <Butterflies />
          <Fireflies />
          <Birds />
        </>
      )}

      <Effects />
    </>
  )
}
