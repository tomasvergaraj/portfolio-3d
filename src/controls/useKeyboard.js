import { useEffect } from 'react'
import { keys } from './input'
import { useStore } from '../store'

// Escucha el teclado a nivel de ventana. Las teclas de movimiento alimentan
// el set compartido; E/Enter abre la estación cercana y Escape cierra.
export function useKeyboard() {
  useEffect(() => {
    const down = (e) => {
      const k = e.key.toLowerCase()

      // Acciones
      if (k === 'escape') {
        useStore.getState().close()
        return
      }
      if (k === 'e' || k === 'enter') {
        const { nearby, active, open } = useStore.getState()
        if (!active && nearby) {
          e.preventDefault()
          open(nearby)
        }
        return
      }

      // Movimiento + sprint (Shift). Se ignoran mientras el panel está abierto.
      if (
        ['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)
      ) {
        keys.add(k)
      }
    }

    const up = (e) => {
      keys.delete(e.key.toLowerCase())
    }

    // Si la ventana pierde el foco, soltamos todas las teclas para no
    // quedar "caminando" solos.
    const blur = () => keys.clear()

    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])
}
