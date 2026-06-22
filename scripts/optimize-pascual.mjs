// Prepara pascual.glb (malla ESTÁTICA del gato, sin huesos) -> public/pascual.glb.
//
// El archivo riggeado (pascual_walk.glb) trae un rig de Unreal con geometría en un
// espacio minúsculo sostenida por la escala de bind de los huesos: renderiza bien
// en reposo pero el skinned mesh COLAPSA en cuanto three.js reproduce cualquier
// animación (probado quitando scale y translation; igual desaparece). Por eso
// usamos la malla estática y el caminar lo hace el componente de forma procedural.
// Como no tiene skin, sí podemos comprimir con meshopt sin romper nada.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'
import { Jimp } from 'jimp'
import { statSync } from 'node:fs'

await MeshoptEncoder.ready

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder })

const doc = await io.read('./character/pascual/pascual.glb')
const root = doc.getRoot()

// Texturas a 1024.
for (const tex of root.listTextures()) {
  const img = tex.getImage()
  if (!img) continue
  try {
    const j = await Jimp.read(Buffer.from(img))
    if (j.width > 1024) j.resize({ w: 1024, h: 1024 })
    tex.setImage(new Uint8Array(await j.getBuffer('image/png')))
  } catch (e) {
    console.log('resize fail:', e.message)
  }
}

await doc.transform(prune(), dedup(), meshopt({ encoder: MeshoptEncoder, level: 'high' }))
await io.write('./public/pascual.glb', doc)
console.log('pascual.glb (estático):', (statSync('./public/pascual.glb').size / 1024 / 1024).toFixed(2), 'MB')
