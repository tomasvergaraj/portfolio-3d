// Audio procedural con Web Audio (sin archivos): viento ambiental + cantos de
// pájaro ocasionales, y SFX para proximidad/apertura de estaciones. El contexto
// se crea tras el primer gesto del usuario (política de autoplay del navegador).

let ctx = null
let master = null
let started = false
let muted = false
let birdTimer = null

const VOL = 0.35

function init() {
  if (ctx) return
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return
  ctx = new AC()
  master = ctx.createGain()
  master.gain.value = muted ? 0 : VOL
  master.connect(ctx.destination)
}

// Ruido marrón en bucle para el viento.
function noiseBuffer() {
  const len = ctx.sampleRate * 2
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const data = buf.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1
    last = (last + 0.02 * white) / 1.02
    data[i] = last * 3.2
  }
  return buf
}

function startWind() {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer()
  src.loop = true
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 480
  const g = ctx.createGain()
  g.gain.value = 0.1
  // LFO que respira el volumen del viento.
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.07
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.05
  lfo.connect(lfoGain)
  lfoGain.connect(g.gain)
  src.connect(lp)
  lp.connect(g)
  g.connect(master)
  src.start()
  lfo.start()
}

function chirp() {
  if (!ctx) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sine'
  const g = ctx.createGain()
  const base = 1800 + Math.random() * 1600
  o.frequency.setValueAtTime(base, t)
  o.frequency.exponentialRampToValueAtTime(base * 1.4, t + 0.07)
  o.frequency.exponentialRampToValueAtTime(base * 0.92, t + 0.15)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.05, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.17)
  o.connect(g)
  g.connect(master)
  o.start(t)
  o.stop(t + 0.2)
}

function scheduleBirds() {
  const loop = () => {
    if (!started) return
    const n = 1 + Math.floor(Math.random() * 2)
    for (let i = 0; i < n; i++) setTimeout(chirp, i * 130)
    birdTimer = setTimeout(loop, 3500 + Math.random() * 7000)
  }
  birdTimer = setTimeout(loop, 2500)
}

export function startAudio() {
  init()
  if (!ctx) return
  if (ctx.state === 'suspended') ctx.resume()
  if (started) return
  started = true
  startWind()
  scheduleBirds()
}

// Blip suave al acercarse a una estación.
export function blip() {
  if (!ctx || muted) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'triangle'
  const g = ctx.createGain()
  o.frequency.setValueAtTime(620, t)
  o.frequency.exponentialRampToValueAtTime(960, t + 0.08)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.1, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18)
  o.connect(g)
  g.connect(master)
  o.start(t)
  o.stop(t + 0.2)
}

// Acorde agradable al abrir una sección.
export function chord() {
  if (!ctx || muted) return
  const t = ctx.currentTime
  ;[523.25, 659.25, 783.99].forEach((f, i) => {
    const o = ctx.createOscillator()
    o.type = 'sine'
    const g = ctx.createGain()
    o.frequency.value = f
    g.gain.setValueAtTime(0.0001, t)
    g.gain.linearRampToValueAtTime(0.08, t + 0.03 + i * 0.02)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9)
    o.connect(g)
    g.connect(master)
    o.start(t)
    o.stop(t + 1.0)
  })
}

export function setMuted(m) {
  muted = m
  if (master && ctx) master.gain.linearRampToValueAtTime(m ? 0 : VOL, ctx.currentTime + 0.12)
}
export function isMuted() {
  return muted
}
