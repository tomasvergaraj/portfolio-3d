// Conversor FBX→GLB que corre en el navegador (lo conduce scripts/fbx-to-glb.mjs
// con Playwright + Chrome del sistema). Se hace en navegador a propósito: el
// FBXLoader de three depende de APIs del DOM y es mucho más fiable aquí que en
// Node. El proxy corporativo no estorba porque three ya está instalado en local.
//
// Expone window.convertFBX(url, { stripMesh }) -> string base64 del GLB binario.
//   • stripMesh=false → exporta malla + esqueleto + animación (el avatar real).
//   • stripMesh=true  → quita las mallas y exporta SOLO los huesos + animación
//                       (para los clips walk/run, que se reaplican al esqueleto
//                       del avatar por nombre de hueso; así no duplicamos malla
//                       ni texturas tres veces).
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

const TEX_KEYS = ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap', 'specularMap', 'bumpMap']

// FBXLoader deja las texturas embebidas como <img> que el GLTFExporter a veces
// no puede leer ("No valid image data"). Las redibujamos a un <canvas> (fuente
// válida para el exporter); si alguna sigue sin datos, la quitamos del material
// para no abortar toda la exportación.
async function bakeTextures(obj) {
  const seen = new Set()
  const meshes = []
  obj.traverse((o) => { if (o.isMesh || o.isSkinnedMesh) meshes.push(o) })
  for (const o of meshes) {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
    for (const m of mats) {
      for (const key of TEX_KEYS) {
        const t = m && m[key]
        if (!t || seen.has(t)) { if (t) continue }
        if (!t) continue
        seen.add(t)
        const img = t.image
        if (img && img.decode) { try { await img.decode() } catch {} }
        const w = (img && (img.width || img.naturalWidth)) || 0
        const h = (img && (img.height || img.naturalHeight)) || 0
        if (w && h) {
          const canvas = document.createElement('canvas')
          canvas.width = w
          canvas.height = h
          canvas.getContext('2d').drawImage(img, 0, 0)
          t.image = canvas
          t.needsUpdate = true
        } else {
          m[key] = null // textura ilegible: descartar el mapa, conservar el color
          m.needsUpdate = true
        }
      }
    }
  }
}

async function convertFBX(url, opts = {}) {
  const { stripMesh = false } = opts
  const loader = new FBXLoader()
  const obj = await loader.loadAsync(url)
  const animations = obj.animations ? obj.animations.slice() : []

  if (stripMesh) {
    const meshes = []
    obj.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) meshes.push(o)
    })
    for (const m of meshes) if (m.parent) m.parent.remove(m)
  } else {
    await bakeTextures(obj)
  }

  const exporter = new GLTFExporter()
  const buf = await exporter.parseAsync(obj, {
    binary: true,
    animations,
    onlyVisible: false,
    includeCustomExtensions: false,
  })

  // ArrayBuffer -> base64 (por trozos para no reventar el stack con apply).
  const bytes = new Uint8Array(buf)
  let bin = ''
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK))
  }
  return btoa(bin)
}

// Diagnóstico: qué texturas trae el FBX y en qué estado están sus imágenes.
async function diagFBX(url) {
  const loader = new FBXLoader()
  const obj = await loader.loadAsync(url)
  const out = []
  const seen = new Set()
  obj.traverse((o) => {
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
    for (const m of mats) {
      for (const key of TEX_KEYS) {
        const t = m && m[key]
        if (!t || seen.has(t)) continue
        seen.add(t)
        const img = t.image
        out.push({
          key,
          imgType: img ? (img.constructor && img.constructor.name) : 'null',
          complete: img ? img.complete : null,
          w: img ? (img.width || img.naturalWidth || 0) : 0,
          h: img ? (img.height || img.naturalHeight || 0) : 0,
          src: img && img.src ? String(img.src).slice(0, 60) : null,
          srcLen: img && img.src ? String(img.src).length : 0,
        })
      }
    }
  })
  return out
}

window.convertFBX = convertFBX
window.diagFBX = diagFBX
window.__convertReady = true
