// Reveal de entrada: cuando el mundo queda listo, los props brotan escalando
// desde 0 con un pequeño "pop" (overshoot), escalonados por distancia al centro
// (una onda de ensamblaje que se abre desde la plaza, en sintonía con el vuelo
// de cámara de entrada). Idea del folio de Bruno Simon (Reveal).
//
// Es un módulo compartido sin estado de React: `beginReveal` marca el instante
// de arranque (lo llama un driver cuando `ready`), y `revealFactor` devuelve la
// escala 0→1 (con overshoot) para un objeto según su distancia al centro.

let startT = null

export function beginReveal(clockT) {
  if (startT === null) startT = clockT
}

// easeOutBack: sobrepasa 1 y se asienta → da el "pop".
const C1 = 1.70158
const C3 = C1 + 1

export function revealFactor(clockT, dist) {
  if (startT === null) return 0 // aún no listo → oculto (el loader cubre)
  const delay = 0.12 + dist * 0.055 // más lejos del centro, más tarde
  const dur = 0.62
  const p = (clockT - startT - delay) / dur
  if (p <= 0) return 0
  if (p >= 1) return 1
  const t = p - 1
  return 1 + C3 * t * t * t + C1 * t * t
}
