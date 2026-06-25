// Suaviza el COLOR base de Chanel: el atlas de Meshy es orgánico, pero su UV lo
// parte en parches duros sobre el modelo ("cuadrados"). Difuminamos el color para
// que las transiciones queden orgánicas; el detalle de pelo lo aporta el normal
// map (que NO se toca). NO es aplanar: conserva la variación de color.
//   node scripts/make-chanel-soft.mjs <in.png> <out.png> [blur=8]
import { Jimp } from 'jimp'
const IN = process.argv[2]
const OUT = process.argv[3] || 'tmp/chanel_soft.png'
const BLUR = Number(process.argv[4] ?? 8)
const img = await Jimp.read(IN)
img.blur(BLUR) // difuminado (box) para fundir los parches
await img.write(OUT)
console.log(`color suavizado (blur ${BLUR}) ${img.width}x${img.height} -> ${OUT}`)
