import { create } from 'zustand'

// Estado compartido entre el mundo 3D (que escribe la proximidad) y la
// interfaz React (que reacciona). Mantener esto fuera de los componentes
// evita re-renderizar el lienzo en cada frame.
export const useStore = create((set, get) => ({
  // id de la estación dentro del radio de interacción, o null
  nearby: null,
  // id de la estación con el panel abierto, o null
  active: null,
  // progreso de carga 0–100 y bandera de listo
  progress: 0,
  ready: false,

  setNearby: (id) => {
    if (get().nearby !== id) set({ nearby: id })
  },
  open: (id) => set({ active: id }),
  close: () => set({ active: null }),
  toggle: (id) => set((s) => ({ active: s.active === id ? null : id })),
  setProgress: (p) => set({ progress: p }),
  setReady: () => set({ ready: true }),
}))

// En desarrollo, exponemos el store para que el script de captura (Playwright)
// pueda abrir paneles de forma determinista. No afecta a producción.
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.__store = useStore
}
