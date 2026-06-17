import React, { useRef, useState } from 'react'
import { touch } from '../controls/input'
import { useStore } from '../store'
import { STATIONS } from '../data/stations'

const MAX = 46 // radio de desplazamiento del stick en px

export function Joystick() {
  const padRef = useRef(null)
  const [stick, setStick] = useState({ x: 0, y: 0 })
  const dragging = useRef(false)

  const nearby = useStore((s) => s.nearby)
  const open = useStore((s) => s.open)
  const station = STATIONS.find((s) => s.id === nearby)

  const update = (e) => {
    if (!dragging.current || !padRef.current) return
    const rect = padRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let dx = e.clientX - cx
    let dy = e.clientY - cy
    const len = Math.hypot(dx, dy)
    if (len > MAX) {
      dx = (dx / len) * MAX
      dy = (dy / len) * MAX
    }
    setStick({ x: dx, y: dy })
    // dy hacia arriba (negativo) = avanzar (-z)
    touch.x = dx / MAX
    touch.z = dy / MAX
  }

  const start = (e) => {
    dragging.current = true
    padRef.current?.setPointerCapture?.(e.pointerId)
    update(e)
  }

  const end = () => {
    dragging.current = false
    setStick({ x: 0, y: 0 })
    touch.x = 0
    touch.z = 0
  }

  return (
    <>
      <div
        ref={padRef}
        className="joystick touch-only"
        onPointerDown={start}
        onPointerMove={update}
        onPointerUp={end}
        onPointerCancel={end}
        role="application"
        aria-label="Control de movimiento"
      >
        <div
          className="stick"
          style={{ transform: `translate(calc(-50% + ${stick.x}px), calc(-50% + ${stick.y}px))` }}
        />
      </div>

      <button
        className="touch-act touch-only"
        disabled={!station}
        style={{ opacity: station ? 1 : 0.4 }}
        onClick={() => station && open(station.id)}
        aria-label={station ? `Entrar a ${station.name}` : 'Acércate a un punto'}
      >
        {station ? 'Entrar' : '·'}
      </button>
    </>
  )
}
