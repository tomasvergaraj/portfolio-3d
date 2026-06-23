import React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'
import { STATIONS } from '../data/stations'
import { Minimap } from './Minimap'

export function Hud({ onOpenMenu }) {
  const nearby = useStore((s) => s.nearby)
  const active = useStore((s) => s.active)
  const open = useStore((s) => s.open)
  const station = STATIONS.find((s) => s.id === nearby)
  const hidden = active !== null

  return (
    <div className="hud" aria-hidden={hidden}>
      <div className="topbar">
        <div className="brand">
          <span className="logo">
            <img src="/logo.png" alt="Tomás Vergara" />
          </span>
          <span className="who">
            <b>Tomás Vergara</b>
            <span>Desarrollador full-stack · Quillota</span>
          </span>
        </div>
        <button className="menu-btn" onClick={onOpenMenu}>
          ☰ Secciones
        </button>
      </div>

      {/* Pista de controles (escritorio) */}
      <div className="hint desk-only">
        <kbd>W</kbd>
        <kbd>A</kbd>
        <kbd>S</kbd>
        <kbd>D</kbd>
        <span>para moverte ·</span>
        <kbd>Shift</kbd>
        <span>para correr ·</span>
        <kbd>Espacio</kbd>
        <span>para saltar · acércate a un punto para entrar</span>
      </div>

      {/* Prompt de proximidad */}
      <AnimatePresence>
        {station && !hidden && (
          <motion.button
            key={station.id}
            className="prompt"
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
            onClick={() => open(station.id)}
          >
            Entrar a <b>{station.name}</b>
            <kbd className="desk-only">E</kbd>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Minimapa / radar de navegación (esquina) */}
      <Minimap />
    </div>
  )
}
