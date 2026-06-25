// Reemplaza la textura base del GLB de Chanel por un PNG SIN PÉRDIDA (el JPEG
// q82 metía bloques 8x8 = "colores cuadrados" sobre el pelaje camo de alta
// frecuencia). PNG 1024 conserva los colores originales sin artefactos.
//   node scripts/retex-chanel.mjs <in.glb> <out.glb> <texture.png> [size=1024]
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'
import { Jimp } from 'jimp'

const IN = process.argv[2]
const OUT = process.argv[3]
const TEX = process.argv[4]
const SIZE = Number(process.argv[5] ?? 1024)

await MeshoptEncoder.ready
await MeshoptDecoder.ready
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })
const doc = await io.read(IN)

const img = await Jimp.read(TEX)
if (img.width > SIZE || img.height > SIZE) img.scaleToFit({ w: SIZE, h: SIZE })
const png = new Uint8Array(await img.getBuffer('image/png'))

const texs = doc.getRoot().listTextures()
if (!texs.length) throw new Error('el GLB no tiene texturas que reemplazar')
for (const t of texs) t.setImage(png).setMimeType('image/png')
console.log(`textura -> PNG ${img.width}x${img.height} (${(png.length / 1024).toFixed(0)} KB) en ${texs.length} slot(s)`)

// Re-comprimir meshopt al reescribir (la geometría ya venía meshopt).
await doc.transform(meshopt({ encoder: MeshoptEncoder }))
await io.write(OUT, doc)
console.log(`escrito ${OUT}`)
