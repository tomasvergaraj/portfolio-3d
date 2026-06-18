import React, { useRef, useState, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html, Float } from '@react-three/drei'
import { useStore } from '../store'
import { StationModel, useStationModelExists } from './StationModel'
import { ModelBoundary } from './ModelBoundary'

// ---- Monumentos por tipo -------------------------------------------------

function Monument({ kind, color }) {
  switch (kind) {
    case 'house':
      return (
        <group>
          <mesh castShadow position={[0, 0.8, 0]}>
            <boxGeometry args={[2, 1.6, 2]} />
            <meshStandardMaterial color="#f3ece0" roughness={0.9} flatShading />
          </mesh>
          <mesh castShadow position={[0, 2, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.7, 1.2, 4]} />
            <meshStandardMaterial color={color} roughness={0.9} flatShading />
          </mesh>
        </group>
      )
    case 'totems':
      return (
        <group>
          {[
            [-1, 0.7, 0, 1.4],
            [0, 1, 0.2, 2],
            [1, 0.8, -0.1, 1.6],
          ].map(([x, h, z, s], i) => (
            <mesh key={i} castShadow position={[x, h, z]}>
              <boxGeometry args={[0.7, s, 0.7]} />
              <meshStandardMaterial color={i === 1 ? color : '#e9e2d4'} roughness={0.9} flatShading />
            </mesh>
          ))}
        </group>
      )
    case 'shards':
      return (
        <Float speed={2} rotationIntensity={0.8} floatIntensity={0.8}>
          <group position={[0, 1.6, 0]}>
            <mesh castShadow>
              <tetrahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color={color} roughness={0.5} metalness={0.2} flatShading />
            </mesh>
            <mesh castShadow position={[0.9, -0.4, 0.3]} scale={0.6}>
              <tetrahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#e9e2d4" roughness={0.6} flatShading />
            </mesh>
            <mesh castShadow position={[-0.8, -0.5, -0.2]} scale={0.5}>
              <octahedronGeometry args={[1, 0]} />
              <meshStandardMaterial color="#ffffff" roughness={0.6} flatShading />
            </mesh>
          </group>
        </Float>
      )
    case 'tower':
      return (
        <group>
          {[
            [0, 0.6, 2.2],
            [0, 1.5, 1.7],
            [0, 2.3, 1.2],
            [0, 3, 0.8],
          ].map(([x, y, w], i) => (
            <mesh key={i} castShadow position={[x, y, 0]}>
              <boxGeometry args={[w, 0.85, w]} />
              <meshStandardMaterial color={i % 2 ? color : '#e9e2d4'} roughness={0.9} flatShading />
            </mesh>
          ))}
        </group>
      )
    case 'lighthouse':
    default:
      return (
        <group>
          <mesh castShadow position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.55, 0.9, 2.8, 12]} />
            <meshStandardMaterial color="#f3ece0" roughness={0.9} flatShading />
          </mesh>
          <mesh castShadow position={[0, 2.5, 0]}>
            <cylinderGeometry args={[0.7, 0.7, 0.3, 12]} />
            <meshStandardMaterial color={color} roughness={0.8} flatShading />
          </mesh>
        </group>
      )
  }
}

// ---- Marcador completo ---------------------------------------------------

export function StationMarker({ station, position }) {
  const beaconRef = useRef()
  const lightRef = useRef()
  const [hovered, setHovered] = useState(false)
  const nearby = useStore((s) => s.nearby === station.id)
  const open = useStore((s) => s.open)
  // Con un panel abierto ocultamos las etiquetas 2D: si no, se cuelan por
  // encima del modal (las dibuja <Html> en el DOM, fuera del lienzo).
  const modalOpen = useStore((s) => s.active !== null)
  // ¿Hay un glb para esta estación en public/? Si sí, usamos el modelo 3D.
  const hasModel = useStationModelExists(station.id)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const pulse = 0.5 + Math.sin(t * 2 + station.angle) * 0.5
    if (beaconRef.current) {
      beaconRef.current.material.emissiveIntensity = 1.4 + pulse * 1.6
      const s = 1 + pulse * 0.12
      beaconRef.current.scale.setScalar(s)
    }
    if (lightRef.current) {
      lightRef.current.intensity = 2 + pulse * 2
    }
  })

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation()
        open(station.id)
      }}
      onPointerOver={() => {
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
    >
      {/* Monumento: modelo 3D real (public/<id>.glb) si existe; si no, las
          primitivas. El modelo se auto-ajusta a tamaño/suelo. */}
      {hasModel ? (
        <ModelBoundary fallback={<Monument kind={station.kind} color={station.color} />}>
          <Suspense fallback={<Monument kind={station.kind} color={station.color} />}>
            <StationModel id={station.id} />
          </Suspense>
        </ModelBoundary>
      ) : (
        <Monument kind={station.kind} color={station.color} />
      )}

      {/* Faro emisivo (lo recoge el bloom) */}
      <mesh ref={beaconRef} position={[0, 4.4, 0]}>
        <sphereGeometry args={[0.32, 20, 20]} />
        <meshStandardMaterial
          color={station.color}
          emissive={station.color}
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>
      <pointLight ref={lightRef} position={[0, 4.4, 0]} color={station.color} distance={9} intensity={2} />

      {/* Haz vertical sutil */}
      <mesh position={[0, 3, 0]}>
        <cylinderGeometry args={[0.05, 0.16, 2.6, 8]} />
        <meshBasicMaterial color={station.color} transparent opacity={0.25} toneMapped={false} />
      </mesh>

      {/* Etiqueta flotante (oculta mientras hay un panel abierto) */}
      {!modalOpen && (
      <Html position={[0, 5.4, 0]} center distanceFactor={16} occlude={false} pointerEvents="none">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 13px',
            borderRadius: 12,
            whiteSpace: 'nowrap',
            background: nearby ? 'var(--ink)' : 'rgba(251,248,242,0.92)',
            color: nearby ? '#fff' : 'var(--ink)',
            border: `1px solid ${nearby ? 'var(--ink)' : 'var(--line)'}`,
            boxShadow: '0 10px 26px -14px rgba(20,30,46,0.5)',
            transform: `scale(${hovered || nearby ? 1.06 : 1})`,
            transition: 'transform .18s ease, background .18s ease, color .18s ease',
            fontFamily: '"Space Grotesk", sans-serif',
            fontWeight: 600,
            fontSize: 15,
            userSelect: 'none',
          }}
        >
          <span style={{ color: nearby ? '#fff' : station.color, fontSize: 13 }}>{station.icon}</span>
          {station.name}
        </div>
      </Html>
      )}
    </group>
  )
}
