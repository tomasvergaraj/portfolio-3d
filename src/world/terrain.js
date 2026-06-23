import { STATIONS, stationPosition } from '../data/stations'

// ─────────────────────────────────────────────────────────────────────────
// Relieve del terreno — FUENTE ÚNICA DE VERDAD de la altura del suelo.
//
// La isla dejó de ser un disco plano: la zona verde rueda en lomas suaves. Para
// no romper nada de lo que se construyó encima (caminos enlosados, fuente,
// monumentos de estación, plaza central, punto de aparición), el relieve se
// *aplana a cero* sobre esas zonas con una máscara. Así sólo los "bolsillos"
// verdes entre los caminos —donde viven árboles, rocas, pasto y flores— se
// elevan, y el centro plano queda como una plaza naturalmente hundida respecto
// a las lomas que la rodean.
//
// Todo lo que se asienta en el suelo (avatar, perro, gato, props, huellas,
// polvo y la propia malla de la isla) llama a `sampleHeight(x, z)`, así que el
// relieve y los objetos siempre concuerdan.
// ─────────────────────────────────────────────────────────────────────────

// Altura de la tapa de pasto en el borde / baseline (antes era un valor fijo
// repartido por media docena de archivos como GROUND_Y≈0.7).
export const TOP_Y = 0.7
export const ISLAND_R = 24

// Ganancia de las lomas (alto máximo, en unidades de mundo, sobre el baseline).
export const AMP = 1.7

// Direcciones radiales de los caminos y posiciones de las estaciones,
// precalculadas (los caminos van del centro a cada estación).
const PATHS = STATIONS.map((s) => {
  const [sx, , sz] = stationPosition(s.angle)
  const len = Math.hypot(sx, sz) || 1
  return { dx: sx / len, dz: sz / len, len, sx, sz }
})

const smoothstep = (a, b, x) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

// Ruido suave (suma de senos): lomas redondeadas y deterministas, sin depender
// de una librería de ruido. Rango aproximado [-1.95, 1.95].
function hills(x, z) {
  return (
    Math.sin(x * 0.16 - 0.4) * Math.cos(z * 0.19 + 2.1) * 1.0 +
    Math.sin(x * 0.3 + 1.7) * Math.cos(z * 0.27 - 0.6) * 0.5 +
    Math.sin((x + z) * 0.12 + 3.0) * 0.45
  )
}

// Máscara [0..1] que decide DÓNDE puede haber relieve. 0 = aplanado (caminos,
// plaza central, pads de estación, borde exterior); 1 = bolsillo verde libre.
function reliefMask(x, z) {
  const r = Math.hypot(x, z)
  // Plaza/centro plano: 0 en el centro, sube a 1 al alejarse.
  let m = smoothstep(6.5, 11, r)
  // Caminos: aplana una franja a lo largo de cada radial (perpendicular pequeña).
  for (const p of PATHS) {
    const along = x * p.dx + z * p.dz
    if (along > -1.5 && along < p.len + 2.5) {
      const perp = Math.abs(x * p.dz - z * p.dx)
      m = Math.min(m, smoothstep(2.0, 3.8, perp))
    }
  }
  // Pads de estación: aplana un disco alrededor de cada monumento.
  for (const p of PATHS) {
    const d = Math.hypot(x - p.sx, z - p.sz)
    m = Math.min(m, smoothstep(3.4, 5.6, d))
  }
  // Borde exterior: vuelve a 0 hacia el rim para mate limpio con el faldón.
  m *= 1 - smoothstep(19.5, 23.5, r)
  return m
}

// Altura (Y de mundo) de la superficie de pasto en (x, z).
export function sampleHeight(x, z) {
  const m = reliefMask(x, z)
  if (m <= 0) return TOP_Y
  // tanh comprime el ruido a (0..1) suave, así el terreno SIEMPRE queda sobre el
  // baseline (lomas que se levantan del plano, sin hoyos que revelen geometría).
  const lift = 0.5 + 0.5 * Math.tanh(hills(x, z) * 0.8)
  return TOP_Y + lift * AMP * m
}
