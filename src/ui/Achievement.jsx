import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'

// Toast de logro desbloqueado: aparece una vez cuando el visitante ha abierto
// las 5 secciones (ver App.jsx). Flota sobre todo —incluido un panel abierto—
// con acento dorado, una insignia de trofeo y se auto-descarta. Acompaña a la
// ráfaga de confeti + fanfarria que dispara el mismo evento. Idea del folio de
// Bruno Simon: recompensar el explorar el mundo entero.
const DISMISS_MS = 5600

export function Achievement() {
  const n = useStore((s) => s.achievementN)
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (n === 0) return
    setShow(true)
    const t = setTimeout(() => setShow(false), DISMISS_MS)
    return () => clearTimeout(t)
  }, [n])

  return (
    <div className="ach-wrap" aria-live="polite">
      <AnimatePresence>
        {show && (
          <motion.div
            className="ach"
            role="status"
            initial={{ opacity: 0, y: -22, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -14, scale: 0.97 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="ach-badge">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 21h8" />
                <path d="M12 17v4" />
                <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
                <path d="M17 5h3v2a3 3 0 0 1-3 3" />
                <path d="M7 5H4v2a3 3 0 0 0 3 3" />
              </svg>
            </span>
            <span className="ach-text">
              <small>Logro desbloqueado</small>
              <b>Explorador — visitaste las 5 secciones</b>
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
