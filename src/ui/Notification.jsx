import React, { useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'
import { STATIONS } from '../data/stations'
import { StationIcon } from '../world/StationIcon'

// Notificación de llegada a una zona (idea de las "zones" del folio de Bruno
// Simon): al entrar al radio de una estación aparece un toast arriba al centro
// con su nombre y se desvanece solo a los pocos segundos. Es informativo; el
// prompt de "Entrar" (abajo) sigue siendo la acción.
const DISMISS_MS = 2800

export function Notification() {
  const notice = useStore((s) => s.notice)
  const active = useStore((s) => s.active)
  const clearNotice = useStore((s) => s.clearNotice)
  const station = notice ? STATIONS.find((s) => s.id === notice.id) : null

  // Auto-descarta tras unos segundos. El `notice.n` en las dependencias reinicia
  // el temporizador si llega un aviso nuevo antes de que se cierre el anterior.
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(clearNotice, DISMISS_MS)
    return () => clearTimeout(t)
  }, [notice, clearNotice])

  return (
    <div className="notice-wrap" aria-live="polite">
      <AnimatePresence>
        {station && active === null && (
          <motion.div
            key={notice.n}
            className="notice"
            initial={{ opacity: 0, y: -18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <span className="notice-dot" style={{ background: station.color }}>
              <StationIcon id={station.id} size={18} color="#fff" />
            </span>
            <span className="notice-text">
              <small>Has llegado a</small>
              <b>{station.name}</b>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
