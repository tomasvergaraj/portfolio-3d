import React, { useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'
import { STATIONS } from '../data/stations'
import { StationIcon } from '../world/StationIcon'
import { useMenuOverlay } from './useMenuOverlay'

// Indicador de logros (idea del folio de Bruno Simon: recompensar explorar).
// Vive en la barra superior: un botón-trofeo con el progreso `N/5` visible desde
// la primera sección visitada; al pulsarlo despliega un panel con el logro
// "Explorador" y el checklist de las 5 secciones. El desbloqueo (las 5) lanza
// además el toast dorado + confeti + fanfarria (ver App.jsx y Achievement.jsx).
function Trophy({ size = 17 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8" />
      <path d="M12 17v4" />
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  )
}

export function Achievements() {
  const visited = useStore((s) => s.visited)
  const [panel, setPanel] = useState(false)
  // Con el panel de logros abierto, oculta las etiquetas flotantes del mundo 3D.
  useMenuOverlay(panel)
  const done = visited.length
  const total = STATIONS.length
  const complete = done >= total

  return (
    <div className="ach-hud">
      <button
        className={`ach-btn${complete ? ' is-complete' : ''}`}
        onClick={() => setPanel((v) => !v)}
        aria-label={`Logros: ${done} de ${total} secciones visitadas`}
        aria-expanded={panel}
        title="Logros"
      >
        <Trophy />
        <motion.span key={done} className="ach-btn-count" initial={{ scale: 1.5 }} animate={{ scale: 1 }} transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}>
          {done}/{total}
        </motion.span>
      </button>

      <AnimatePresence>
        {panel && (
          <motion.div
            className="ach-pop"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.24, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <div className="ach-pop-head">
              <span className={`ach-pop-medal${complete ? ' is-complete' : ''}`}>
                <Trophy size={18} />
              </span>
              <span className="ach-pop-meta">
                <b>Explorador</b>
                <small>{complete ? '¡Logro desbloqueado!' : `${done} de ${total} secciones visitadas`}</small>
              </span>
            </div>
            <div className="ach-progress">
              <span style={{ width: `${(done / total) * 100}%` }} />
            </div>
            <ul className="ach-list">
              {STATIONS.map((st) => {
                const on = visited.includes(st.id)
                return (
                  <li key={st.id} className={on ? 'is-on' : ''}>
                    <span className="ach-li-dot" style={on ? { background: st.color } : undefined}>
                      {on && <StationIcon id={st.id} size={12} color="#fff" />}
                    </span>
                    <span className="ach-li-name">{st.name}</span>
                    {on && <span className="ach-li-check">✓</span>}
                  </li>
                )
              })}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
