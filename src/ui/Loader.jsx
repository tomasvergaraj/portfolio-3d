import React, { useEffect } from 'react'
import { useProgress } from '@react-three/drei'
import { AnimatePresence, motion } from 'motion/react'
import { useStore } from '../store'

export function Loader() {
  const { progress, active } = useProgress()
  const ready = useStore((s) => s.ready)
  const setReady = useStore((s) => s.setReady)

  useEffect(() => {
    // Marca listo cuando la carga termina (con un respiro para evitar parpadeos).
    if (!active && progress >= 100) {
      const t = setTimeout(setReady, 450)
      return () => clearTimeout(t)
    }
  }, [active, progress, setReady])

  useEffect(() => {
    // Red de seguridad: si algún recurso externo (p. ej. el HDRI) no llega,
    // entramos igual al mundo en vez de quedar cargando para siempre.
    const safety = setTimeout(setReady, 6000)
    return () => clearTimeout(safety)
  }, [setReady])

  return (
    <AnimatePresence>
      {!ready && (
        <motion.div
          className="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="loader-mark"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <img src="/logo.png" alt="Tomás Vergara" />
          </motion.div>
          <div className="loader-text">Cargando el mundo…</div>
          <div className="loader-bar">
            <i style={{ width: `${Math.round(progress)}%` }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
