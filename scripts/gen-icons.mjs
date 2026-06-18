// Genera toda la iconografía del navegador a partir de public/logo.png,
// redimensionando con jimp y empaquetando el favicon.ico.
// Salidas en public/: favicon.ico, favicon-16/32/48.png, apple-touch-icon.png,
// icon-192.png, icon-512.png, icon-512-maskable.png.
import { Jimp } from 'jimp'
import { writeFile } from 'node:fs/promises'

const SRC = 'public/logo.png'

async function png(size) {
  const img = await Jimp.read(SRC)
  img.resize({ w: size, h: size })
  return Buffer.from(await img.getBuffer('image/png'))
}

// Empaqueta varios PNG en un .ico (formato ICO con PNG embebido).
function packIco(entries) {
  const count = entries.length
  const header = Buffer.alloc(6)
  header.writeUInt16LE(0, 0)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(count, 4)
  const dir = Buffer.alloc(16 * count)
  let offset = 6 + 16 * count
  entries.forEach((e, i) => {
    const b = i * 16
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, b + 0)
    dir.writeUInt8(e.size >= 256 ? 0 : e.size, b + 1)
    dir.writeUInt16LE(1, b + 4)
    dir.writeUInt16LE(32, b + 6)
    dir.writeUInt32LE(e.png.length, b + 8)
    dir.writeUInt32LE(offset, b + 12)
    offset += e.png.length
  })
  return Buffer.concat([header, dir, ...entries.map((e) => e.png)])
}

async function main() {
  const out = (name, buf) => writeFile(`public/${name}`, buf)

  const p16 = await png(16)
  const p32 = await png(32)
  const p48 = await png(48)
  await out('favicon-16.png', p16)
  await out('favicon-32.png', p32)
  await out('apple-touch-icon.png', await png(180))
  await out('icon-192.png', await png(192))
  await out('icon-512.png', await png(512))
  await out('icon-512-maskable.png', await png(512))
  await out('favicon.ico', packIco([
    { size: 16, png: p16 },
    { size: 32, png: p32 },
    { size: 48, png: p48 },
  ]))

  console.log('OK iconos en public/ (desde logo.png)')
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
