import React, { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { worldState } from './worldState'
import { sampleHeight } from './terrain'
import { revealFactor } from './reveal'

// Faroles que flanquean la plaza y ENCIENDEN con el atardecer (leen worldState.dusk,
// que escribe DayNight). Cohesionan con el ciclo día/noche, las luciérnagas y la
// hora dorada. El brillo es emisivo (lo recoge el bloom) + un charco de luz cálida
// aditivo en el suelo; NO usan point-lights reales (perf), con un parpadeo sutil de
// vela. Idea del folio de Bruno Simon (Lanterns/PoleLights). Los postes son
// escenografía siempre visible; sólo la luz sube con `dusk`.
const ANGLES = [36, 108, 180, 252, 324] // entre los caminos (que van a las estaciones)
const R = 7.5
const HEAD_Y = 1.7
const WARM = '#ffcf87'
const DARK = '#2f2a26'

export function Lanterns() {
  const heads = useRef([])
  const glows = useRef([])
  const groups = useRef([])

  const posts = useMemo(
    () =>
      ANGLES.map((a) => {
        const rad = (a * Math.PI) / 180
        const x = Math.sin(rad) * R
        const z = Math.cos(rad) * R
        return { x, y: sampleHeight(x, z), z, phase: a }
      }),
    []
  )

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const dusk = worldState.dusk
    for (let i = 0; i < posts.length; i++) {
      const p = posts[i]
      const flick = 0.9 + 0.1 * Math.sin(t * 7 + p.phase)
      const hm = heads.current[i]
      if (hm) hm.emissiveIntensity = (0.12 + dusk * 2.6) * flick
      const gm = glows.current[i]
      if (gm) gm.opacity = dusk * 0.3 * flick
      // Reveal de entrada (brota con el resto de los props).
      const g = groups.current[i]
      if (g) g.scale.setScalar(revealFactor(t, Math.hypot(p.x, p.z)))
    }
  })

  return (
    <group>
      {posts.map((p, i) => (
        <group key={i} ref={(el) => (groups.current[i] = el)} position={[p.x, p.y, p.z]}>
          {/* Poste */}
          <mesh castShadow position={[0, 0.75, 0]}>
            <cylinderGeometry args={[0.05, 0.07, 1.5, 8]} />
            <meshStandardMaterial color={DARK} roughness={0.9} />
          </mesh>
          {/* Soporte */}
          <mesh castShadow position={[0, 1.52, 0]}>
            <boxGeometry args={[0.16, 0.08, 0.16]} />
            <meshStandardMaterial color={DARK} roughness={0.9} />
          </mesh>
          {/* Cabeza luminosa (emisiva → bloom al atardecer) */}
          <mesh position={[0, HEAD_Y, 0]}>
            <boxGeometry args={[0.22, 0.3, 0.22]} />
            <meshStandardMaterial
              ref={(el) => (heads.current[i] = el)}
              color={WARM}
              emissive={WARM}
              emissiveIntensity={0.12}
              toneMapped={false}
              roughness={0.5}
            />
          </mesh>
          {/* Tapa */}
          <mesh castShadow position={[0, HEAD_Y + 0.2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.18, 0.13, 4]} />
            <meshStandardMaterial color={DARK} roughness={0.9} flatShading />
          </mesh>
          {/* Charco de luz cálida (faux, aditivo): sube con el atardecer */}
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.06, 0]}>
            <circleGeometry args={[2.4, 28]} />
            <meshBasicMaterial
              ref={(el) => (glows.current[i] = el)}
              color={WARM}
              transparent
              opacity={0}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      ))}
    </group>
  )
}
