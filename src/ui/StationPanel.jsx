import React from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useStore } from '../store'
import { STATIONS } from '../data/stations'

// Cada estación entra con una transformación distinta.
const VARIANTS = {
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
  right: {
    initial: { opacity: 0, x: 72 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 72 },
  },
  left: {
    initial: { opacity: 0, x: -72 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -72 },
  },
  up: {
    initial: { opacity: 0, y: 84 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 84 },
  },
  zoom: {
    initial: { opacity: 0, scale: 0.82 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.82 },
  },
}

export function StationPanel() {
  const active = useStore((s) => s.active)
  const close = useStore((s) => s.close)
  const reduce = useReducedMotion()
  const station = STATIONS.find((s) => s.id === active)

  const variant = station ? VARIANTS[station.variant] || VARIANTS.fade : VARIANTS.fade
  // Con movimiento reducido, todo entra con un fundido simple.
  const v = reduce ? VARIANTS.fade : variant

  return (
    <AnimatePresence>
      {station && (
        <>
          <motion.div
            className="overlay-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={close}
          />
          <div className="panel-wrap">
            <motion.div
              className="panel"
              initial={v.initial}
              animate={v.animate}
              exit={v.exit}
              transition={{ duration: reduce ? 0.2 : 0.42, ease: [0.2, 0.8, 0.2, 1] }}
              role="dialog"
              aria-modal="true"
              aria-label={station.name}
            >
              <button className="overlay-close" onClick={close} aria-label="Cerrar">
                ✕
              </button>

              <motion.div
                initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: reduce ? 0 : 0.12, duration: 0.4 }}
              >
                <station.Content />
                <button className="overlay-back" onClick={close}>
                  ← Volver al mundo
                </button>
              </motion.div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
