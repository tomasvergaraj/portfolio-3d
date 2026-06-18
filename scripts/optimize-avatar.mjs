// Comprime un GLB de avatar (con skinning + animación) para web SIN decimar la
// malla (simplify rompe los pesos de skin). Reduce texturas, cuantiza y aplica
// EXT_meshopt_compression. Pensado para los GLB que salen de fbx-to-glb.mjs.
//
// Uso:
//   node scripts/optimize-avatar.mjs <entrada.glb> <salida.glb> [texSize] [anim]
//     anim  -> el GLB es SOLO animación (huesos, sin malla): no toca texturas ni
//              poda nodos, solo recompone keyframes y comprime.
//   --diffuse=<jpg>  inyecta ese JPEG como baseColorTexture del material
//   --normal=<jpg>   inyecta ese JPEG como normalTexture del material
// (Las texturas del FBX de Mixamo van embebidas pero FBXLoader no las extrae;
//  se sacan con tmp/extract-jpg.mjs y se reinyectan aquí.)
import { readFileSync } from 'node:fs'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, weld, prune, meshopt, resample } from '@gltf-transform/functions'
import { MeshoptEncoder, MeshoptDecoder } from 'meshoptimizer'
import { Jimp } from 'jimp'

const IN = process.argv[2]
const OUT = process.argv[3]
const TEXSIZE = Number(process.argv[4] ?? 1024)
const ANIM_ONLY = process.argv.includes('anim')
const arg = (name) => { const a = process.argv.find((x) => x.startsWith(`--${name}=`)); return a ? a.split('=')[1] : null }
const DIFFUSE = arg('diffuse')
const NORMAL = arg('normal')
const FLIPV = process.argv.includes('flipv') // voltear texturas en V (convenio FBX↔glTF)

if (!IN || !OUT) {
  console.error('Uso: node scripts/optimize-avatar.mjs <in.glb> <out.glb> [texSize] [anim]')
  process.exit(1)
}

// Redimensiona un JPEG de disco a <= TEXSIZE y devuelve Uint8Array (jpeg q82).
async function loadTex(path) {
  const img = await Jimp.read(path)
  if (FLIPV) img.flip({ horizontal: false, vertical: true })
  if (img.width > TEXSIZE || img.height > TEXSIZE) img.scaleToFit({ w: TEXSIZE, h: TEXSIZE })
  const buf = await img.getBuffer('image/jpeg', { quality: 82 })
  return new Uint8Array(buf)
}

async function main() {
  await MeshoptEncoder.ready
  await MeshoptDecoder.ready
  const io = new NodeIO()
    .registerExtensions(ALL_EXTENSIONS)
    .registerDependencies({ 'meshopt.encoder': MeshoptEncoder, 'meshopt.decoder': MeshoptDecoder })
  const doc = await io.read(IN)

  // IMPORTANTE: NADA de quantize() en estos modelos. quantize() reubica las
  // posiciones con un transform de nodo que los skinned meshes ignoran (usan
  // espacio de huesos), así que deforma el avatar en un "pico". meshopt por sí
  // solo ya comprime bien y es seguro con skinning.
  if (ANIM_ONLY) {
    // Solo huesos + animación: quitar keyframes redundantes y comprimir. NO se
    // poda (prune borraría los huesos que no tienen malla que los referencie).
    await doc.transform(resample(), dedup())
    await doc.transform(meshopt({ encoder: MeshoptEncoder }))
  } else {
    // Avatar completo. ORDEN IMPORTANTE: inyectar las texturas ANTES de prune(),
    // porque si el material no referencia ninguna textura, prune() considera las
    // UVs (TEXCOORD_0) "sin usar" y las borra → la textura quedaría muestreando
    // un solo punto (avatar de color plano).
    if (DIFFUSE) {
      const tex = doc.createTexture('diffuse').setImage(await loadTex(DIFFUSE)).setMimeType('image/jpeg')
      for (const m of doc.getRoot().listMaterials()) {
        m.setBaseColorFactor([1, 1, 1, 1]) // que el color venga 100% de la textura
        m.setBaseColorTexture(tex)
      }
    }
    if (NORMAL) {
      const tex = doc.createTexture('normal').setImage(await loadTex(NORMAL)).setMimeType('image/jpeg')
      for (const m of doc.getRoot().listMaterials()) m.setNormalTexture(tex)
    }

    // weld() re-indexa la malla (el FBX→GLB sale sin índices, ~817K vértices):
    // baja muchísimo el tamaño y es seguro con skinning (fusiona solo vértices
    // idénticos, conserva JOINTS/WEIGHTS).
    await doc.transform(dedup(), weld(), prune(), resample())

    // Recomprimir cualquier textura ya presente y la recién inyectada.
    for (const tex of doc.getRoot().listTextures()) {
      const data = tex.getImage()
      if (!data) continue
      const img = await Jimp.read(Buffer.from(data))
      if (img.width > TEXSIZE || img.height > TEXSIZE) img.scaleToFit({ w: TEXSIZE, h: TEXSIZE })
      const buf = await img.getBuffer('image/jpeg', { quality: 82 })
      tex.setImage(new Uint8Array(buf)).setMimeType('image/jpeg')
    }
    await doc.transform(meshopt({ encoder: MeshoptEncoder }))
  }

  await io.write(OUT, doc)
  console.log(`${IN} -> ${OUT}${ANIM_ONLY ? ' [solo anim]' : `, texturas <= ${TEXSIZE}px`}, meshopt`)
}
main().catch((e) => { console.error(e); process.exit(1) })
