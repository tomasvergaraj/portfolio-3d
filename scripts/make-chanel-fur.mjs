// Empareja el pelaje de Chanel: el atlas de Meshy es un camuflaje irregular
// (parches claros/oscuros) que se ve "disparejo". Aplanamos el manto hacia un
// tono cálido uniforme COMPRIMIENDO la variación de valor (no la borra del todo:
// deja una sombra sutil para que conserve forma) y MANTENEMOS su matiz. Los
// rasgos saturados (ojos ámbar, naricita) se preservan por máscara de saturación.
// Mismo espíritu que scripts/make-dog-fur.mjs (Bruna gris uniforme).
//   node scripts/make-chanel-fur.mjs <in.png> <out.png>
import { Jimp } from 'jimp'

const IN = process.argv[2]
const OUT = process.argv[3] || 'tmp/chanel_fur.png'

// Tono base del manto (greige cálido, derivado de la media del atlas, ~142,129,120).
const TARGET = { r: 150, g: 135, b: 121 }
const FLATTEN = 0.28 // cuánta variación de valor se conserva (0 = plano, 1 = original)
// Máscara de rasgos: saturación a partir de la cual se conserva el píxel original.
const SAT_LO = 0.32 // por debajo = manto (se aplana)
const SAT_HI = 0.5 // por encima = rasgo (ojos/nariz, se conserva)

const lum = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b
const meanL = lum(TARGET.r, TARGET.g, TARGET.b)
const clamp = (v) => (v < 0 ? 0 : v > 255 ? 255 : v)
const smooth = (e0, e1, x) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)))
  return t * t * (3 - 2 * t)
}

const img = await Jimp.read(IN)
const { width: w, height: h, data } = img.bitmap
for (let i = 0; i < data.length; i += 4) {
  const r = data[i], g = data[i + 1], b = data[i + 2]
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b)
  const sat = mx === 0 ? 0 : (mx - mn) / mx
  const keep = smooth(SAT_LO, SAT_HI, sat) // 1 = rasgo (original), 0 = manto

  // Manto: matiz del target, valor con la desviación comprimida.
  const L = lum(r, g, b)
  const newL = meanL + (L - meanL) * FLATTEN
  const k = newL / meanL
  const cr = TARGET.r * k, cg = TARGET.g * k, cb = TARGET.b * k

  data[i] = clamp(cr * (1 - keep) + r * keep)
  data[i + 1] = clamp(cg * (1 - keep) + g * keep)
  data[i + 2] = clamp(cb * (1 - keep) + b * keep)
}

await img.write(OUT)
console.log(`pelaje emparejado ${w}x${h} -> ${OUT} (target ${TARGET.r},${TARGET.g},${TARGET.b}, flatten ${FLATTEN})`)
