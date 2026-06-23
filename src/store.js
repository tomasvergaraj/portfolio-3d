import { create } from 'zustand'

// Estado compartido entre el mundo 3D (que escribe la proximidad) y la
// interfaz React (que reacciona). Mantener esto fuera de los componentes
// evita re-renderizar el lienzo en cada frame.
export const useStore = create((set, get) => ({
  // id de la estación dentro del radio de interacción, o null
  nearby: null,
  // notificación de llegada a una zona: { id, n } o null. `n` es un contador que
  // crece en cada aviso para reiniciar la animación al re-entrar a la misma zona.
  notice: null,
  _noticeN: 0,
  // id de la estación con el panel abierto, o null
  active: null,
  // ids de las secciones ya abiertas (visitadas) en esta sesión. Cuando se
  // visitan todas, se desbloquea el logro de exploración (idea del folio de
  // Bruno Simon: recompensar el explorar el mundo entero).
  visited: [],
  // contador del logro: 0 = bloqueado; 1 = desbloqueado. El toast observa su cambio.
  achievementN: 0,
  // progreso de carga 0–100 y bandera de listo
  progress: 0,
  ready: false,
  // contador de celebraciones (Konami): la ráfaga de confeti observa su cambio
  confettiN: 0,
  // mascota enfocada por la cámara (zoom al hacer clic), o null
  focusPet: null,

  setNearby: (id) => {
    if (get().nearby !== id) set({ nearby: id })
  },
  notify: (id) => set((s) => ({ notice: { id, n: s._noticeN + 1 }, _noticeN: s._noticeN + 1 })),
  clearNotice: () => set({ notice: null }),
  open: (id) =>
    set((s) => ({
      active: id,
      visited: s.visited.includes(id) ? s.visited : [...s.visited, id],
    })),
  close: () => set({ active: null }),
  toggle: (id) =>
    set((s) => ({
      active: s.active === id ? null : id,
      visited: s.visited.includes(id) ? s.visited : [...s.visited, id],
    })),
  // Desbloquea el logro una sola vez (idempotente).
  unlockAchievement: () => set((s) => (s.achievementN === 0 ? { achievementN: 1 } : {})),
  setProgress: (p) => set({ progress: p }),
  setReady: () => set({ ready: true }),
  celebrate: () => set((s) => ({ confettiN: s.confettiN + 1 })),
  setFocusPet: (id) => set({ focusPet: id }),
  clearFocusPet: () => {
    if (get().focusPet !== null) set({ focusPet: null })
  },
}))

// En desarrollo, exponemos el store para que el script de captura (Playwright)
// pueda abrir paneles de forma determinista. No afecta a producción.
if (import.meta.env?.DEV && typeof window !== 'undefined') {
  window.__store = useStore
}
