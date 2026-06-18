import * as THREE from 'three'

// PRNG determinista para que la textura se vea igual en cada carga.
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Genera una textura de suelo low-poly por código (sin archivos): un color base
// con manchas suaves más claras/oscuras (tileable, envolviendo en los bordes) y
// un grano fino. Pensada para verse sutil al multiplicar sobre la malla.
export function makeGroundTexture({
  base,
  light,
  dark,
  spots = 70,
  speckle = 0.05,
  grain = 16,
  size = 256,
  seed = 1,
}) {
  const c = document.createElement('canvas')
  c.width = c.height = size
  const g = c.getContext('2d')
  g.fillStyle = base
  g.fillRect(0, 0, size, size)

  const r = rng(seed)
  const blob = (x, y, rad, color, alpha) => {
    const grd = g.createRadialGradient(x, y, 0, x, y, rad)
    grd.addColorStop(0, color)
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    g.globalAlpha = alpha
    g.fillStyle = grd
    g.beginPath()
    g.arc(x, y, rad, 0, Math.PI * 2)
    g.fill()
  }

  for (let i = 0; i < spots; i++) {
    const x = r() * size
    const y = r() * size
    const rad = size * (0.05 + r() * 0.12)
    const color = r() < 0.5 ? light : dark
    const alpha = 0.12 + r() * 0.22
    // Dibuja la mancha y sus copias desplazadas para que el patrón sea tileable.
    for (const dx of [-size, 0, size]) {
      for (const dy of [-size, 0, size]) blob(x + dx, y + dy, rad, color, alpha)
    }
  }

  // Grano fino: ruido por píxel de baja amplitud.
  g.globalAlpha = 1
  const img = g.getImageData(0, 0, size, size)
  const d = img.data
  for (let i = 0; i < d.length; i += 4) {
    if (r() < speckle) {
      const n = (r() * 2 - 1) * grain
      d[i] += n
      d[i + 1] += n
      d[i + 2] += n
    }
  }
  g.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 4
  return tex
}
