import { useEffect, useRef } from 'react'
import { useStore } from './store'
import { STATIONS } from './data/stations'

// Deep-links por URL: el hash de la página abre/cierra secciones, y la sección
// abierta se refleja en la URL para poder COMPARTIR un enlace directo
// (p. ej. .../#proyectos abre Proyectos al cargar). Acepta el id o el code de la
// estación; al escribir usa el code (más legible).
//
// Lectura: en la carga y en `hashchange` (deep-link directo o navegación del
// usuario) sincroniza el store con el hash. Escritura: al cambiar la sección
// activa refleja la URL con replaceState (no ensucia el historial ni dispara
// hashchange, así que no hay bucles).

const stationFromHash = (hash) => {
  const key = (hash || '').replace(/^#/, '').toLowerCase()
  if (!key) return null
  return STATIONS.find((s) => s.id === key || s.code === key) || null
}

export function useDeepLinks() {
  const active = useStore((s) => s.active)
  // Sección reflejada por última vez en la URL. Empieza en `undefined` para no
  // tocar la URL en el primer render: así el hash inicial (deep-link directo)
  // manda y no lo borramos. Imprescindible con StrictMode, que invoca los
  // effects dos veces en dev (montar → limpiar → montar).
  const written = useRef(undefined)

  // Hash → store (carga inicial + navegación con hash).
  useEffect(() => {
    const sync = () => {
      const st = stationFromHash(window.location.hash)
      const cur = useStore.getState().active
      if (st) {
        if (cur !== st.id) useStore.getState().open(st.id)
      } else if (cur !== null) {
        useStore.getState().close()
      }
    }
    sync()
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])

  // Store → URL (refleja la sección abierta para compartir). Solo escribe cuando
  // la sección activa CAMBIA de verdad respecto a lo último que pusimos; en el
  // primer render no toca nada (deja que el hash inicial gobierne).
  useEffect(() => {
    if (written.current === undefined) {
      written.current = active
      return
    }
    if (written.current === active) return
    written.current = active
    const st = active ? STATIONS.find((s) => s.id === active) : null
    const want = st ? `#${st.code}` : ''
    if (want === window.location.hash) return
    const url = want || window.location.pathname + window.location.search
    window.history.replaceState(null, '', url)
  }, [active])
}
