// Optimiza Rover1.glb -> public/rover.glb para usarlo como mascota:
// - conserva solo los clips que usamos (Idle, Travel + un par de emotes)
// - reduce las texturas 1024 -> 512 (con jimp)
// - comprime con EXT_meshopt_compression (lo que ya usa el proyecto)
// y de paso reporta el tamaño y el extent del modelo para ajustar la escala.
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, prune, meshopt } from '@gltf-transform/functions'
import { MeshoptEncoder } from 'meshoptimizer'
import { Jimp } from 'jimp'
import { statSync } from 'node:fs'

await MeshoptEncoder.ready

const KEEP = new Set(['Idle', 'Travel', 'Pleased', 'Congratulate'])
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({ 'meshopt.encoder': MeshoptEncoder })

const doc = await io.read('./character/dog/Rover1.glb')
const root = doc.getRoot()

// 1) Quita clips que no usamos.
for (const a of root.listAnimations()) if (!KEEP.has(a.getName())) a.dispose()

// 2) Reduce texturas a 512 px.
for (const tex of root.listTextures()) {
  const img = tex.getImage()
  if (!img) continue
  try {
    const j = await Jimp.read(Buffer.from(img))
    j.resize({ w: 512, h: 512 })
    const out = await j.getBuffer('image/png')
    tex.setImage(new Uint8Array(out))
  } catch (e) {
    console.log('resize fail:', e.message)
  }
}

// 3) Limpia y comprime.
await doc.transform(prune(), dedup(), meshopt({ encoder: MeshoptEncoder, level: 'high' }))
await io.write('./public/rover.glb', doc)

// Reporte para ajustar escala/orientación.
console.log('rover.glb:', (statSync('./public/rover.glb').size / 1024 / 1024).toFixed(2), 'MB')
console.log('clips:', root.listAnimations().map((a) => a.getName()).join(', '))
let mn = [1e9, 1e9, 1e9]
let mx = [-1e9, -1e9, -1e9]
for (const m of root.listMeshes())
  for (const p of m.listPrimitives()) {
    const pos = p.getAttribute('POSITION')
    if (!pos) continue
    const a = pos.getMin([])
    const b = pos.getMax([])
    for (let i = 0; i < 3; i++) {
      mn[i] = Math.min(mn[i], a[i])
      mx[i] = Math.max(mx[i], b[i])
    }
  }
console.log('extent local (x,y,z):', mx.map((v, i) => (v - mn[i]).toFixed(3)).join(', '))
for (const n of root.listNodes()) {
  const s = n.getScale()
  if (Math.abs(s[0] - 1) > 1e-4 || Math.abs(s[1] - 1) > 1e-4 || Math.abs(s[2] - 1) > 1e-4)
    console.log('node scale:', n.getName(), s.map((v) => v.toFixed(4)).join(','))
}
