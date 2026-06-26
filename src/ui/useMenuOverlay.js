import { useEffect } from 'react'
import { useStore } from '../store'

// Marca un menú/overlay de UI como abierto mientras `open` sea true. Sirve para
// que el mundo 3D oculte las etiquetas flotantes de las secciones (dibujadas con
// <Html> en el DOM), que si no se colarían por encima del menú. Cualquier menú
// nuevo sólo tiene que llamar a este hook con su estado de apertura.
export function useMenuOverlay(open) {
  useEffect(() => {
    if (!open) return
    const { enterMenu, exitMenu } = useStore.getState()
    enterMenu()
    return exitMenu
  }, [open])
}
