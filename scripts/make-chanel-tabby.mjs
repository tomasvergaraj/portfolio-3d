// Gradúa el color base de Chanel para acercarlo a la gata REAL (tabby marrón
// cálida con marcas oscuras): suaviza apenas los parches duros de la UV, sube
// saturación y contraste (marcas definidas) y aplica un tinte cálido (dorado).
//   node scripts/make-chanel-tabby.mjs <in.png> <out.png> [blur] [sat] [con] [warmR] [warmB]
import { Jimp } from 'jimp'
const IN = process.argv[2]
const OUT = process.argv[3] || 'tmp/chanel_tabby.png'
const BLUR = Number(process.argv[4] ?? 3)
const SAT = Number(process.argv[5] ?? 1.5) // >1 sube saturación
const CON = Number(process.argv[6] ?? 1.28) // >1 sube contraste
const WR = Number(process.argv[7] ?? 1.12) // tinte cálido: rojo
const WB = Number(process.argv[8] ?? 0.8) // tinte cálido: azul (baja)

const img = await Jimp.read(IN)
if (BLUR > 0) img.blur(BLUR)
const d = img.bitmap.data
const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
for (let i = 0; i < d.length; i += 4) {
  let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255
  const L = 0.299 * r + 0.587 * g + 0.114 * b
  // saturación (alejar del gris)
  r = L + (r - L) * SAT; g = L + (g - L) * SAT; b = L + (b - L) * SAT
  // contraste alrededor de 0.5
  r = (r - 0.5) * CON + 0.5; g = (g - 0.5) * CON + 0.5; b = (b - 0.5) * CON + 0.5
  // tinte cálido (dorado)
  r *= WR; b *= WB
  // rolloff de altas luces: comprime lo más claro para que no haya parches
  // cremosos sueltos (la gata real es dorada con marcas oscuras, sin blancos)
  const HI = 0.6
  for (const ch of [0, 1, 2]) {
    let v = ch === 0 ? r : ch === 1 ? g : b
    if (v > HI) v = HI + (v - HI) * 0.45
    if (ch === 0) r = v; else if (ch === 1) g = v; else b = v
  }
  d[i] = clamp(r) * 255; d[i + 1] = clamp(g) * 255; d[i + 2] = clamp(b) * 255
}
await img.write(OUT)
console.log(`tabby grade blur=${BLUR} sat=${SAT} con=${CON} warm=${WR}/${WB} -> ${OUT}`)
