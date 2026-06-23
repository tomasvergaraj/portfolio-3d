import { useEffect, useRef } from 'react'

// Detector del código Konami (↑ ↑ ↓ ↓ ← → ← → B A). Llama onMatch al completarlo.
// Convive con los controles de movimiento (no hace preventDefault); sólo observa.
const SEQ = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

export function useKonami(onMatch) {
  const cb = useRef(onMatch)
  cb.current = onMatch
  const idx = useRef(0)

  useEffect(() => {
    const onKey = (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key
      if (k === SEQ[idx.current]) {
        idx.current++
        if (idx.current === SEQ.length) {
          idx.current = 0
          cb.current?.()
        }
      } else {
        // Reinicia; permite que esta tecla inicie la secuencia de nuevo.
        idx.current = k === SEQ[0] ? 1 : 0
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}
