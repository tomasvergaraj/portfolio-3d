import React, { useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { readInput } from '../controls/input'
import { useStore } from '../store'
import { STATIONS, stationPosition } from '../data/stations'
import { AvatarModel, AVATAR_MODEL_URL } from './AvatarModel'
import { DogModel, DOG_MODEL_URL } from './DogModel'
import { ModelBoundary } from './ModelBoundary'
import { playerPos, playerMotion } from './playerState'

const SPEED = 6.4
const SPRINT_MULT = 1.85 // velocidad al correr (Shift / joystick a fondo)
// Salto: velocidad inicial y gravedad ajustadas para que el tiempo en el aire
// (2·V/|G| ≈ 0.42 s) coincida con el tramo de vuelo del clip de salto, así la
// animación y el movimiento van sincronizados. Altura máxima V²/(2·|G|) ≈ 0.8.
// El avatar solo salta desde el suelo.
const JUMP_V = 7.6
const GRAVITY = -36
const CLAMP_R = 20.5
const INTERACT_R = 3.6
const CAM_OFFSET = new THREE.Vector3(0, 12.5, 16.5)
const DOG_LAG = 26
// Distancia mínima que el perro guarda respecto al avatar. En reposo el rastro
// se llena con la posición actual del jugador, así que sin esto el perro se
// asentaría justo encima del personaje. Lo empujamos hacia atrás este radio.
const DOG_STANDOFF = 2.0
// Con un modelo animado, su propio ciclo de marcha da el balanceo (no añadimos
// el movimiento procedural que usan las primitivas).
const USE_DOG_MODEL = !!DOG_MODEL_URL
const USE_AVATAR_MODEL = !!AVATAR_MODEL_URL
// Altura de la superficie caminable de la isla (tapa de pasto en y≈0.7). El
// avatar y el perro se asientan sobre ella; antes quedaban hundidos en el suelo.
const GROUND_Y = 0.7

// Interpola ángulos por el camino más corto (evita el salto en ±π).
function lerpAngle(a, b, t) {
  let diff = b - a
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return a + diff * t
}

const smooth = (p) => p * p * (3 - 2 * p)

// Intro cinematográfica: la cámara arranca en una vista aérea amplia y vuela
// hasta la posición de juego cuando el mundo queda listo.
const INTRO_START_POS = new THREE.Vector3(0, 34, 46)
const INTRO_LOOK = new THREE.Vector3(0, 2, 0)
const INTRO_DUR = 2.8

// Cámara en reposo: tras unos segundos sin moverse, órbita lenta del mundo.
const IDLE_DELAY = 12 // s sin moverse para empezar a orbitar
const ORBIT_R = 33
const ORBIT_Y = 17
const ORBIT_SPEED = 0.06 // rad/s

// Posiciones precalculadas de las estaciones (para la proximidad).
const STATION_POS = STATIONS.map((s) => {
  const [x, , z] = stationPosition(s.angle)
  return { id: s.id, x, z }
})

// Vectores temporales reutilizados por la cámara (evita basura por frame).
const _camDesired = new THREE.Vector3()
const _lookDesired = new THREE.Vector3()

// Avatar de primitivas: sirve de fallback mientras carga el modelo 3D o si no
// está disponible.
function PrimitiveBody() {
  return (
    <>
      {/* Cuerpo */}
      <mesh castShadow position={[0, 1, 0]}>
        <capsuleGeometry args={[0.45, 0.7, 8, 16]} />
        <meshStandardMaterial color="#2f6bff" roughness={0.6} />
      </mesh>
      {/* Cabeza */}
      <mesh castShadow position={[0, 1.95, 0]}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial color="#ffe0c2" roughness={0.8} />
      </mesh>
      {/* Ojos (frente +z) */}
      <mesh position={[0.15, 2, 0.36]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#16202e" />
      </mesh>
      <mesh position={[-0.15, 2, 0.36]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial color="#16202e" />
      </mesh>
      {/* Pelo */}
      <mesh castShadow position={[0, 2.18, -0.04]}>
        <sphereGeometry args={[0.44, 20, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3a2a1c" roughness={1} />
      </mesh>
    </>
  )
}

function Avatar({ groupRef, bodyRef }) {
  return (
    <group ref={groupRef} position={[0, GROUND_Y - 0.2, 6]}>
      <group ref={bodyRef}>
        {/* Avatar: modelo 3D real si hay uno configurado (con fallback a
            primitivas mientras carga o si falla); si no, primitivas. */}
        {AVATAR_MODEL_URL ? (
          <ModelBoundary fallback={<PrimitiveBody />}>
            <Suspense fallback={<PrimitiveBody />}>
              <AvatarModel />
            </Suspense>
          </ModelBoundary>
        ) : (
          <PrimitiveBody />
        )}
      </group>
      {/* El asentado en el suelo lo da la sombra direccional (castShadow) */}
    </group>
  )
}

// Perro de primitivas: fallback mientras carga el glb o si no está disponible.
function DogPrimitive() {
  return (
    <>
      {/* Cuerpo alargado */}
      <mesh castShadow position={[0, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <capsuleGeometry args={[0.26, 0.95, 8, 12]} />
        <meshStandardMaterial color="#a86a3a" roughness={0.85} />
      </mesh>
      {/* Cabeza */}
      <mesh castShadow position={[0.72, 0.62, 0]}>
        <sphereGeometry args={[0.3, 18, 18]} />
        <meshStandardMaterial color="#b5743f" roughness={0.85} />
      </mesh>
      {/* Hocico */}
      <mesh castShadow position={[1.0, 0.55, 0]}>
        <boxGeometry args={[0.3, 0.22, 0.24]} />
        <meshStandardMaterial color="#8a5630" roughness={0.85} />
      </mesh>
      {/* Orejas */}
      <mesh position={[0.66, 0.78, 0.22]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.22, 0.34, 0.06]} />
        <meshStandardMaterial color="#7c4a28" roughness={0.9} />
      </mesh>
      <mesh position={[0.66, 0.78, -0.22]} rotation={[-0.3, 0, 0]}>
        <boxGeometry args={[0.22, 0.34, 0.06]} />
        <meshStandardMaterial color="#7c4a28" roughness={0.9} />
      </mesh>
      {/* Patas */}
      {[
        [0.55, 0.18],
        [-0.55, 0.18],
        [0.55, -0.18],
        [-0.55, -0.18],
      ].map(([x, z], i) => (
        <mesh key={i} castShadow position={[x, 0.18, z]}>
          <cylinderGeometry args={[0.09, 0.09, 0.36, 8]} />
          <meshStandardMaterial color="#8a5630" roughness={0.9} />
        </mesh>
      ))}
      {/* Cola */}
      <mesh position={[-0.7, 0.62, 0]} rotation={[0, 0, 0.7]}>
        <cylinderGeometry args={[0.05, 0.1, 0.5, 8]} />
        <meshStandardMaterial color="#a86a3a" roughness={0.9} />
      </mesh>
    </>
  )
}

function Dog({ dogRef }) {
  return (
    <group ref={dogRef} position={[0, GROUND_Y, 7.5]} rotation={[0, Math.PI / 2, 0]}>
      {/* Mascota: modelo 3D real si hay uno configurado (con fallback a
          primitivas mientras carga o si falla); si no, primitivas. */}
      {DOG_MODEL_URL ? (
        <ModelBoundary fallback={<DogPrimitive />}>
          <Suspense fallback={<DogPrimitive />}>
            <DogModel />
          </Suspense>
        </ModelBoundary>
      ) : (
        <DogPrimitive />
      )}
    </group>
  )
}

export function Player() {
  const groupRef = useRef()
  const bodyRef = useRef()
  const dogRef = useRef()
  const trail = useRef([])
  const lastNearby = useRef(null)
  const walk = useRef(0)
  const dogGait = useRef(0)
  // Estado del salto: y (altura sobre el suelo), vy (velocidad vertical), active.
  const jump = useRef({ y: 0, vy: 0, active: false })
  const intro = useRef({ started: false, t: 0 })
  const idle = useRef({ t: 0, orbiting: false, a: 0 })
  // Punto al que mira la cámara, interpolado para transiciones suaves.
  // Se inicia en el objetivo del avatar para no barrer al cargar.
  const lookAt = useRef(new THREE.Vector3(0, GROUND_Y + 0.5, 6))

  useFrame((state, dt) => {
    const g = groupRef.current
    if (!g) return
    // dt puede dispararse tras un cambio de pestaña; lo acotamos.
    const d = Math.min(dt, 0.05)

    const active = useStore.getState().active
    const ready = useStore.getState().ready
    // Congelar el control durante la carga y la intro de cámara.
    const frozen = active !== null || !ready
    const { x, z, moving, sprint, jump: jumpHeld } = frozen
      ? { x: 0, z: 0, moving: false, sprint: false, jump: false }
      : readInput()

    const speed = SPEED * (sprint && moving ? SPRINT_MULT : 1)
    if (moving) {
      g.position.x += x * speed * d
      g.position.z += z * speed * d
      const target = Math.atan2(x, z)
      g.rotation.y = lerpAngle(g.rotation.y, target, 0.2)
    }

    // Límite circular de la isla
    const r = Math.hypot(g.position.x, g.position.z)
    if (r > CLAMP_R) {
      g.position.x *= CLAMP_R / r
      g.position.z *= CLAMP_R / r
    }
    // Salto: se dispara desde el suelo al pulsar espacio; luego sigue una
    // parábola por gravedad hasta volver a tocar el suelo.
    const j = jump.current
    if (jumpHeld && !j.active) {
      j.active = true
      j.vy = JUMP_V
      playerMotion.jumpId++
    }
    if (j.active) {
      j.vy += GRAVITY * d
      j.y += j.vy * d
      if (j.y <= 0) {
        j.y = 0
        j.vy = 0
        j.active = false
      }
    }

    // Comparte la posición y el movimiento para otros sistemas (pasto, polvo…)
    playerPos.copy(g.position)
    playerMotion.moving = moving
    playerMotion.sprint = sprint && moving
    playerMotion.jumping = j.active

    // Balanceo al caminar (más rápido y marcado al correr). Con el avatar
    // animado lo da su propio clip de caminar; no añadimos el rebote procedural.
    // La altura del salto se aplica siempre (afecta al cuerpo, no a la cámara).
    walk.current += moving ? d * (sprint ? 16 : 10) : 0
    if (bodyRef.current) {
      let y = j.y
      if (!USE_AVATAR_MODEL) {
        const amp = sprint ? 0.17 : 0.12
        y += moving ? Math.abs(Math.sin(walk.current)) * amp : 0
      }
      bodyRef.current.position.y = y
    }

    // Estela para el perro
    trail.current.push({ x: g.position.x, z: g.position.z })
    if (trail.current.length > DOG_LAG + 30) trail.current.shift()
    const dog = dogRef.current
    if (dog && trail.current.length > DOG_LAG) {
      const tgt = trail.current[trail.current.length - DOG_LAG]
      // Empuja el objetivo para que el perro no se solape con el avatar: si el
      // punto del rastro queda dentro del radio de cortesía (típico en reposo),
      // lo separamos a DOG_STANDOFF en la dirección perro→avatar.
      let tx = tgt.x
      let tz = tgt.z
      let ox = tx - g.position.x
      let oz = tz - g.position.z
      let od = Math.hypot(ox, oz)
      if (od < DOG_STANDOFF) {
        // Dirección desde el avatar hacia el perro (o hacia atrás si coinciden).
        let bx = dog.position.x - g.position.x
        let bz = dog.position.z - g.position.z
        let bd = Math.hypot(bx, bz)
        if (bd < 0.001) {
          bx = -Math.sin(g.rotation.y)
          bz = -Math.cos(g.rotation.y)
          bd = 1
        }
        tx = g.position.x + (bx / bd) * DOG_STANDOFF
        tz = g.position.z + (bz / bd) * DOG_STANDOFF
      }
      const px = dog.position.x
      const pz = dog.position.z
      // Al correr, el perro acelera para no quedarse atrás (catch-up mayor).
      const follow = sprint ? 0.26 : 0.18
      dog.position.x += (tx - px) * follow
      dog.position.z += (tz - pz) * follow
      const ddx = dog.position.x - px
      const ddz = dog.position.z - pz
      const step = Math.hypot(ddx, ddz)
      if (step > 0.001) {
        // El perro mira hacia +x en su modelo; restamos π/2 para que el hocico
        // apunte a la dirección de avance en vez de caminar de lado.
        const dtar = Math.atan2(ddx, ddz) - Math.PI / 2
        dog.rotation.y = lerpAngle(dog.rotation.y, dtar, 0.25)
      }
      // Con el modelo animado el balanceo lo da su ciclo de marcha: lo dejamos
      // pegado al suelo. Con el perro de primitivas mantenemos el galope manual.
      if (USE_DOG_MODEL) {
        dog.position.y = GROUND_Y
      } else {
        const running = step > 0.004
        dogGait.current += step * (sprint ? 11 : 7)
        const amp = sprint ? 0.34 : 0.16
        dog.position.y = GROUND_Y + (running ? Math.abs(Math.sin(dogGait.current)) * amp : 0)
      }
    }

    // Cámara: persigue al avatar, y al abrir una sección hace un dolly suave
    // hacia el monumento de esa estación (y vuelve al cerrar). El lookAt también
    // se interpola para que la transición entrar/salir no salte.
    const cam = state.camera
    const station = active ? STATION_POS.find((s) => s.id === active) : null

    // Inactividad: cuenta el tiempo sin moverse (y sin panel) para orbitar.
    if (moving || active) idle.current.t = 0
    else idle.current.t += Math.min(dt, 0.4)
    const introDone = intro.current.t >= INTRO_DUR
    const wantOrbit = ready && introDone && !station && idle.current.t > IDLE_DELAY
    if (wantOrbit && !idle.current.orbiting) {
      // Empieza la órbita desde el ángulo actual de la cámara (transición suave).
      idle.current.orbiting = true
      idle.current.a = Math.atan2(cam.position.x, cam.position.z)
    } else if (!wantOrbit) {
      idle.current.orbiting = false
    }

    if (station) {
      _camDesired.set(
        station.x + CAM_OFFSET.x * 0.52,
        CAM_OFFSET.y * 0.8,
        station.z + CAM_OFFSET.z * 0.52
      )
      _lookDesired.set(station.x, 2.4, station.z)
    } else if (idle.current.orbiting) {
      idle.current.a += d * ORBIT_SPEED
      _camDesired.set(Math.sin(idle.current.a) * ORBIT_R, ORBIT_Y, Math.cos(idle.current.a) * ORBIT_R)
      _lookDesired.set(0, 2.5, 0)
    } else {
      _camDesired.set(
        g.position.x + CAM_OFFSET.x,
        CAM_OFFSET.y,
        g.position.z + CAM_OFFSET.z
      )
      _lookDesired.set(g.position.x, g.position.y + 1.2, g.position.z)
    }
    if (!ready) {
      // Durante la carga, mantenemos la vista aérea de la intro.
      cam.position.copy(INTRO_START_POS)
      lookAt.current.copy(INTRO_LOOK)
      cam.lookAt(lookAt.current)
    } else if (intro.current.t < INTRO_DUR) {
      // Vuelo de entrada: de la vista aérea a la posición de juego.
      if (!intro.current.started) intro.current.started = true
      intro.current.t += Math.min(dt, 0.4) // tiempo real (acotado) → ~constante
      const p = smooth(Math.min(intro.current.t / INTRO_DUR, 1))
      cam.position.lerpVectors(INTRO_START_POS, _camDesired, p)
      lookAt.current.lerpVectors(INTRO_LOOK, _lookDesired, p)
      cam.lookAt(lookAt.current)
    } else {
      const ease = 1 - Math.pow(0.001, d) // suavizado estable ante saltos de dt
      cam.position.lerp(_camDesired, station ? ease * 0.9 : ease)
      lookAt.current.lerp(_lookDesired, station ? ease * 0.9 : ease)
      cam.lookAt(lookAt.current)
    }

    // Proximidad a estaciones
    let nearest = null
    let nd = INTERACT_R
    for (const s of STATION_POS) {
      const dist = Math.hypot(g.position.x - s.x, g.position.z - s.z)
      if (dist < nd) {
        nd = dist
        nearest = s.id
      }
    }
    if (nearest !== lastNearby.current) {
      lastNearby.current = nearest
      useStore.getState().setNearby(nearest)
    }
  })

  return (
    <>
      <Avatar groupRef={groupRef} bodyRef={bodyRef} />
      <Dog dogRef={dogRef} />
    </>
  )
}
