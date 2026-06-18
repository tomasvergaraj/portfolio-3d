// Optimiza cualquier .glb pesado a un asset apto para web: suelda vértices,
// decima la malla y reduce/recomprime las texturas (con jimp, sin binario nativo).
//
// Uso:
//   node scripts/optimize-glb.mjs <entrada> <salida> [ratioTris] [tamañoTextura]
// Ej.:
//   node scripts/optimize-glb.mjs character/roca.glb public/roca.glb 0.06 1024
//   node scripts/optimize-glb.mjs character/arbol.glb public/arbol.glb 0.04 1024
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { weld, simplify, dedup, prune, reorder, quantize, meshopt } from '@gltf-transform/functions'
import { MeshoptSimplifier, MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'
import { Jimp } from 'jimp'

const IN = process.argv[2]
const OUT = process.argv[3]
const RATIO = Number(process.argv[4] ?? 0.05) // fracción de triángulos a conservar
const TEXSIZE = Number(process.argv[5] ?? 1024)
const USE_MESHOPT = process.argv.includes('meshopt') // compresión EXT_meshopt_compression

if (!IN || !OUT) {
  console.error('Uso: node scripts/optimize-glb.mjs <entrada.glb> <salida.glb> [ratio] [texSize]')
  process.exit(1)
}

const triCount = (doc) =>
  doc.getRoot().listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? 0) / 3, 0)

async function main() {
  await MeshoptSimplifier.ready
  await MeshoptEncoder.ready
  await MeshoptDecoder.ready
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })
  const doc = await io.read(IN)
  const before = triCount(doc)

  await doc.transform(
    weld(),
    simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.06 }),
    dedup(),
    prune()
  )

  // Texturas: redimensionar y recomprimir con jimp.
  for (const tex of doc.getRoot().listTextures()) {
    const img = await Jimp.read(Buffer.from(tex.getImage()))
    if (img.width > TEXSIZE || img.height > TEXSIZE) img.scaleToFit({ w: TEXSIZE, h: TEXSIZE })
    const buf = await img.getBuffer('image/jpeg', { quality: 80 })
    tex.setImage(new Uint8Array(buf)).setMimeType('image/jpeg')
  }

  // Compresión de geometría EXT_meshopt_compression (decoder embebido en three).
  if (USE_MESHOPT) {
    await MeshoptEncoder.ready
    await doc.transform(reorder({ encoder: MeshoptEncoder }), quantize(), meshopt({ encoder: MeshoptEncoder }))
  }

  await io.write(OUT, doc)
  console.log(`${IN} -> ${OUT}: tris ${Math.round(before)} -> ${Math.round(triCount(doc))} (ratio ${RATIO}), texturas <= ${TEXSIZE}px${USE_MESHOPT ? ', meshopt' : ''}`)
}
main().catch((e) => { console.error(e); process.exit(1) })
