import React, { useEffect, useRef } from 'react'
import { useStore } from '../store'
import { STATIONS, RING_RADIUS } from '../data/stations'
import { playerPos } from '../world/playerState'
import { StationIcon } from '../world/StationIcon'

// Minimapa / radar de navegación. La cámara va fija DETRÁS del avatar, así que el
// mundo está alineado con la pantalla: world +x → derecha, world +z → abajo
// (hacia la cámara = primer plano). Por eso el radar usa el mismo mapeo y la
// posición de cada pip indica directamente hacia dónde caminar.
//
// El punto del avatar se mueve por requestAnimationFrame mutando el transform
// del nodo (sin re-render de React cada frame, como el resto del proyecto).
const SIZE = 120 // diámetro del contenedor (px)
const MAP_R = 50 // radio útil en px (la orilla de la isla cae aquí)
const VIEW_R = 24 // radio de mundo que cubre el radar (= radio de la isla)
const K = MAP_R / VIEW_R
const C = SIZE / 2

export function Minimap() {
  const open = useStore((s) => s.open)
  const nearby = useStore((s) => s.nearby)
  const dotRef = useRef()

  useEffect(() => {
    let raf
    const loop = () => {
      const el = dotRef.current
      if (el) {
        const x = C + playerPos.x * K
        const y = C + playerPos.z * K
        el.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`
      }
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  return (
    <div className="minimap" style={{ width: SIZE, height: SIZE }} role="group" aria-label="Mapa de navegación">
      <div className="mm-ring" aria-hidden="true" />
      {STATIONS.map((s) => {
        const a = (s.angle * Math.PI) / 180
        const x = C + Math.sin(a) * RING_RADIUS * K
        const y = C + Math.cos(a) * RING_RADIUS * K
        return (
          <button
            key={s.id}
            className={`mm-pip${nearby === s.id ? ' near' : ''}`}
            style={{ left: `${x}px`, top: `${y}px`, '--pc': s.color }}
            onClick={() => open(s.id)}
            aria-label={`Ir a ${s.name}`}
          >
            <StationIcon id={s.id} size={11} color="#fff" />
            <span className="mm-tip">{s.name}</span>
          </button>
        )
      })}
      <div ref={dotRef} className="mm-you" aria-hidden="true" />
    </div>
  )
}
