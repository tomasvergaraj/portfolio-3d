import React from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { STATIONS } from '../data/stations'
import { StationIcon } from '../world/StationIcon'
import { useMenuOverlay } from './useMenuOverlay'

export function SectionMenu({ openMenu, setOpenMenu, onPick }) {
  // Mientras el menú está abierto, oculta las etiquetas flotantes del mundo 3D.
  useMenuOverlay(openMenu)
  return (
    <AnimatePresence>
      {openMenu && (
        <>
          <motion.div
            className="sheet-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpenMenu(false)}
          />
          <motion.div
            className="sheet"
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            transition={{ duration: 0.28, ease: [0.2, 0.8, 0.2, 1] }}
            role="dialog"
            aria-label="Secciones del portafolio"
          >
            <p className="ov-eyebrow">Secciones</p>
            <h3>Ir directo a una sección</h3>
            <p className="sub">¿Sin ganas de recorrer la isla? Salta a donde quieras.</p>
            <div className="sheet-list">
              {STATIONS.map((st) => (
                <button
                  key={st.id}
                  className="sheet-item"
                  onClick={() => {
                    setOpenMenu(false)
                    onPick(st.id)
                  }}
                >
                  <span className="si" style={{ background: st.color }}>
                    <StationIcon id={st.id} size={18} color="#fff" />
                  </span>
                  <span>
                    <span className="sn" style={{ display: 'block' }}>
                      {st.name}
                    </span>
                    <span className="sc">{st.code}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
