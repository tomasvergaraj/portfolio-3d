// Genera public/dog_fur.png a partir de la textura de color de dog_walk.glb,
// APLANANDO el gris del pelaje a un tono uniforme (quita las líneas oscuras del
// lomo/cabeza) pero CONSERVANDO los tonos naranja (orejas/hocico/patas), los
// blancos de los ojos y los oscuros (pupilas/contornos). Así Bruna queda con un
// pelaje gris uniforme sin perder cara ni acentos cálidos.
//
// Uso: node scripts/make-dog-fur.mjs
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { MeshoptDecoder } from 'meshoptimizer'
import { Jimp } from 'jimp'
import { writeFile } from 'node:fs/promises'

// Gris uniforme del pelaje (sRGB). Sube/baja para aclarar/oscurecer.
const FUR = { r: 0x2b, g: 0x2f, b: 0x37 }

async function main() {
  await MeshoptDecoder.ready
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.decoder': MeshoptDecoder })
  const doc = await io.read('public/dog_walk.glb')
  const tex = doc.getRoot().listMaterials()[0].getBaseColorTexture()
  const bytes = Buffer.from(tex.getImage())

  const img = await Jimp.read(bytes)
  const { data } = img.bitmap
  let flattened = 0
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2]
    const lum = 0.299 * r + 0.587 * g + 0.114 * b
    const warm = r > g + 6 && r - b > 24 // naranja / tostado → conservar
    if (warm) continue
    if (lum > 198) continue // blanco del ojo / brillos → conservar
    if (lum < 46) continue // pupila / contorno / fondo → conservar
    // resto = pelaje gris (incluidas las líneas) → tono uniforme
    data[i] = FUR.r
    data[i + 1] = FUR.g
    data[i + 2] = FUR.b
    flattened++
  }
  const out = await img.getBuffer('image/png')
  await writeFile('public/dog_fur.png', out)
  console.log('OK public/dog_fur.png', img.bitmap.width + 'x' + img.bitmap.height, '| pixeles aplanados:', flattened)
}
main().catch((e) => { console.error(e.message); process.exit(1) })
