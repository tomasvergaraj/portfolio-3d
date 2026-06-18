// Extrae los JPEG embebidos dentro de un FBX (Mixamo los embebe pero el
// FBXLoader de three no los expone: deja las texturas con image=null). Escanea
// los bytes buscando bloques JPEG (SOI FF D8 FF ... EOI FF D9) y los vuelca.
//
// Uso:
//   node scripts/extract-fbx-textures.mjs <entrada.fbx> [prefijoSalida=tmp/Image_]
// Para el avatar: el 1.º suele ser el difuso y el 2.º el normal map.
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const IN = process.argv[2]
const PREFIX = process.argv[3] || 'tmp/Image_'
if (!IN) {
  console.error('Uso: node scripts/extract-fbx-textures.mjs <in.fbx> [prefijo]')
  process.exit(1)
}

const buf = readFileSync(IN)
const found = []
let i = 0
while (i < buf.length - 2) {
  if (buf[i] === 0xff && buf[i + 1] === 0xd8 && buf[i + 2] === 0xff) {
    let j = i + 2
    while (j < buf.length - 1) {
      if (buf[j] === 0xff && buf[j + 1] === 0xd9) { j += 2; break }
      j++
    }
    const len = j - i
    if (len > 2000) { found.push({ start: i, len }); i = j; continue }
  }
  i++
}

mkdirSync(dirname(`${PREFIX}0`), { recursive: true })
console.log(`JPEGs embebidos en ${IN}: ${found.length}`)
found.forEach((f, k) => {
  const name = `${PREFIX}${k}.jpg`
  writeFileSync(name, buf.subarray(f.start, f.start + f.len))
  console.log(`  ${name}  ${(f.len / 1024).toFixed(0)} KB`)
})
