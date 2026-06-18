// Optimiza character/arbol.glb (1.1M tris, ~25MB de texturas) a un asset apto
// para web: suelda vértices, decima la malla y reduce/recomprime las texturas.
// Salida: public/arbol.glb
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { weld, simplify, dedup, prune } from '@gltf-transform/functions'
import { MeshoptSimplifier } from 'meshoptimizer'
import { Jimp } from 'jimp'

const IN = 'character/arbol.glb'
const OUT = 'public/arbol.glb'
const RATIO = Number(process.argv[2] ?? 0.04) // fracción de triángulos a conservar
const TEXSIZE = Number(process.argv[3] ?? 1024)

const triCount = (doc) =>
  doc.getRoot().listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0)

async function main() {
  await MeshoptSimplifier.ready
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS)
  const doc = await io.read(IN)

  const before = triCount(doc)

  await doc.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.06 }),
    dedup(),
    prune()
  )

  // Texturas: redimensionar y recomprimir con jimp (sin binario nativo).
  for (const tex of doc.getRoot().listTextures()) {
    const img = await Jimp.read(Buffer.from(tex.getImage()))
    if (img.width > TEXSIZE || img.height > TEXSIZE) {
      img.scaleToFit({ w: TEXSIZE, h: TEXSIZE })
    }
    const buf = await img.getBuffer('image/jpeg', { quality: 80 })
    tex.setImage(new Uint8Array(buf)).setMimeType('image/jpeg')
  }

  await io.write(OUT, doc)
  console.log(`tris ${Math.round(before)} -> ${Math.round(triCount(doc))} (ratio ${RATIO}), texturas <= ${TEXSIZE}px`)
}
main().catch((e) => { console.error(e); process.exit(1) })
