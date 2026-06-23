// Audio procedural con Web Audio (sin archivos): viento ambiental + cantos de
// pájaro ocasionales, y SFX para proximidad/apertura de estaciones. El contexto
// se crea tras el primer gesto del usuario (política de autoplay del navegador).

let ctx = null
let master = null
let started = false
let muted = false
let birdTimer = null
// Nodos del viento que modulamos en vivo con el viento global del mundo.
let windGain = null
let windFilter = null
// Buffer de ruido reutilizado para pasos/aterrizaje.
let stepBuf = null

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
  // Guardamos para modular el viento con la racha global (setWindLevel).
  windGain = g
  windFilter = lp
}

// Olas de la orilla: ruido en banda, muy lento y sutil, con su propia respiración
// (rompiente). Ahora que la isla tiene mar y playa, da fondo costero.
function startWaves() {
  const src = ctx.createBufferSource()
  src.buffer = noiseBuffer()
  src.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.frequency.value = 560
  bp.Q.value = 0.55
  const g = ctx.createGain()
  g.gain.value = 0.045
  const lfo = ctx.createOscillator()
  lfo.frequency.value = 0.12 // rompiente lenta
  const lfoGain = ctx.createGain()
  lfoGain.gain.value = 0.035
  lfo.connect(lfoGain)
  lfoGain.connect(g.gain)
  src.connect(bp)
  bp.connect(g)
  g.connect(master)
  src.start()
  lfo.start()
}

// El viento de audio sigue la fuerza del viento GLOBAL (mismo vector que pasto,
// agua, hojas…): sube de volumen y abre el filtro con la racha. Coherencia.
export function setWindLevel(strength) {
  if (!ctx || !windGain) return
  const s = Math.min(Math.max(strength, 0), 1)
  windGain.gain.setTargetAtTime(0.06 + s * 0.12, ctx.currentTime, 0.4)
  if (windFilter) windFilter.frequency.setTargetAtTime(340 + s * 520, ctx.currentTime, 0.5)
}

// Paso: golpe corto y terroso (un tramo de ruido filtrado con caída rápida).
// Variado por pitch/posición para que no suene mecánico.
export function footstep(sprint = false) {
  if (!ctx || muted) return
  if (!stepBuf) stepBuf = noiseBuffer()
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = stepBuf
  src.playbackRate.value = 0.9 + Math.random() * 0.35
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = sprint ? 920 : 640
  const g = ctx.createGain()
  const vol = sprint ? 0.085 : 0.055
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13)
  src.connect(lp)
  lp.connect(g)
  g.connect(master)
  src.start(t, Math.random() * 1.4, 0.15)
}

// Salto: un breve "whoosh" ascendente.
export function jumpSfx() {
  if (!ctx || muted) return
  const t = ctx.currentTime
  const o = ctx.createOscillator()
  o.type = 'sine'
  const g = ctx.createGain()
  o.frequency.setValueAtTime(300, t)
  o.frequency.exponentialRampToValueAtTime(660, t + 0.18)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(0.05, t + 0.02)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
  o.connect(g)
  g.connect(master)
  o.start(t)
  o.stop(t + 0.24)
}

// Aterrizaje: golpe sordo (ruido grave de caída corta).
export function landSfx() {
  if (!ctx || muted) return
  if (!stepBuf) stepBuf = noiseBuffer()
  const t = ctx.currentTime
  const src = ctx.createBufferSource()
  src.buffer = stepBuf
  const lp = ctx.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 360
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.12, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
  src.connect(lp)
  lp.connect(g)
  g.connect(master)
  src.start(t, Math.random() * 1.0, 0.22)
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
  startWaves()
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
