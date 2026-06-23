import React, { useRef, Suspense } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { readInput } from '../controls/input'
import { useStore } from '../store'
import { STATIONS, stationPosition } from '../data/stations'
import { AvatarModel, AVATAR_MODEL_URL } from './AvatarModel'
import { ModelBoundary } from './ModelBoundary'
import { playerPos, playerMotion } from './playerState'
import { petPos } from './petState'
import { sampleHeight } from './terrain'

const SPEED = 6.4
const SPRINT_MULT = 1.85 // velocidad al correr (Shift / joystick a fondo)
// Salto: instantáneo (se dispara en el acto, sin anticipación). La altura y la pose
// las maneja el avatar reconstruyendo el root motion del clip (playerMotion.jumpY);
// aquí solo la aplicamos al cuerpo, así pose y altura van perfectamente alineadas.
const CLAMP_R = 20.5
const INTERACT_R = 3.6
// Radio de "zona" de cada estación: más amplio que el de interacción, para que la
// notificación de llegada aparezca al acercarse, antes del prompt de "Entrar".
const ZONE_R = 6.4
const CAM_OFFSET = new THREE.Vector3(0, 12.5, 16.5)
// Parallax: cuánto se desplaza la cámara siguiendo el puntero (sensación folio).
const PARALLAX_POS = new THREE.Vector2(2.6, 1.1) // desplazamiento de la cámara (x, y)
const PARALLAX_LOOK = new THREE.Vector2(1.1, 0.5) // desplazamiento del punto mirado
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

export function Player({ reducedMotion = false }) {
  const groupRef = useRef()
  const bodyRef = useRef()
  const lastNearby = useRef(null)
  const lastZone = useRef(null)
  const walk = useRef(0)
  // Espacio pulsado el frame anterior, para disparar el salto solo en el flanco.
  const prevJump = useRef(false)
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

    // Zoom a una mascota (clic): se mantiene hasta que te muevas. Al moverte se
    // suelta y la cámara vuelve a seguir al avatar.
    const focusPet = useStore.getState().focusPet
    if (moving && focusPet) useStore.getState().clearFocusPet()
    const petActive = focusPet && !moving ? focusPet : null

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
    // Asienta el avatar sobre el relieve: el grupo sigue la altura del terreno
    // (las lomas) y el salto lo añade aparte el cuerpo (bodyRef + jumpY), así
    // pose y altura van alineadas tanto en plano como en cuesta.
    g.position.y = sampleHeight(g.position.x, g.position.z) - 0.2
    // Salto: en el flanco de pulsación de espacio (y si no está ya saltando) avisamos
    // al avatar con un nuevo jumpId; él reproduce el clip y reconstruye la altura.
    if (jumpHeld && !prevJump.current && !playerMotion.jumping && !frozen) playerMotion.jumpId++
    prevJump.current = jumpHeld

    // Comparte la posición y el movimiento para otros sistemas (pasto, polvo…)
    playerPos.copy(g.position)
    playerMotion.moving = moving
    playerMotion.sprint = sprint && moving

    // Balanceo al caminar (más rápido y marcado al correr) + altura del salto. Con
    // el avatar real el balanceo lo da su clip; la altura del salto la reconstruye el
    // avatar (playerMotion.jumpY) y aquí la aplicamos al cuerpo.
    walk.current += moving ? d * (sprint ? 16 : 10) : 0
    if (bodyRef.current) {
      let y = playerMotion.jumpY
      if (!USE_AVATAR_MODEL) {
        const amp = sprint ? 0.17 : 0.12
        y += moving ? Math.abs(Math.sin(walk.current)) * amp : 0
      }
      bodyRef.current.position.y = y
    }

    // Cámara: persigue al avatar, y al abrir una sección hace un dolly suave
    // hacia el monumento de esa estación (y vuelve al cerrar). El lookAt también
    // se interpola para que la transición entrar/salir no salte.
    const cam = state.camera
    const station = active ? STATION_POS.find((s) => s.id === active) : null

    // Inactividad: cuenta el tiempo sin moverse (y sin panel/zoom) para orbitar.
    if (moving || active || petActive) idle.current.t = 0
    else idle.current.t += Math.min(dt, 0.4)
    const introDone = intro.current.t >= INTRO_DUR
    const wantOrbit = ready && introDone && !station && !petActive && idle.current.t > IDLE_DELAY
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
    } else if (petActive) {
      // Acercamiento a la mascota: dolly más corto y bajo, mirándola de cerca.
      const p = petPos[petActive]
      _camDesired.set(p.x + CAM_OFFSET.x * 0.5, CAM_OFFSET.y * 0.6, p.z + CAM_OFFSET.z * 0.5)
      _lookDesired.set(p.x, p.y + 0.55, p.z)
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

    // Parallax de puntero: desplaza sutilmente cámara y punto mirado siguiendo el
    // mouse (state.pointer va de -1 a 1). Solo en seguimiento/órbita —nunca con un
    // panel abierto ni durante la intro— y se anula con prefers-reduced-motion.
    if (!reducedMotion && !station && !petActive && ready && introDone) {
      const px = THREE.MathUtils.clamp(state.pointer.x, -1, 1)
      const py = THREE.MathUtils.clamp(state.pointer.y, -1, 1)
      _camDesired.x += px * PARALLAX_POS.x
      _camDesired.y += py * PARALLAX_POS.y
      _lookDesired.x += px * PARALLAX_LOOK.x
      _lookDesired.y += py * PARALLAX_LOOK.y
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
      // Barrido en arco: en vez de un dolly recto, la cámara entra curvando —se
      // abre hacia un lado y se eleva en el punto medio del vuelo (pico en p=0.5)
      // antes de asentarse. Da una entrada más cinematográfica. Se omite con
      // prefers-reduced-motion para no mover de más.
      if (!reducedMotion) {
        const arc = Math.sin(p * Math.PI)
        cam.position.x += arc * 15
        cam.position.y += arc * 4.5
      }
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

    // Zona de llegada (radio más amplio que el de interacción): al cruzar hacia
    // la zona de una estación dispara una notificación transitoria. Solo en el
    // flanco de entrada; si sales y vuelves, se dispara de nuevo.
    let zone = null
    let zd = ZONE_R
    for (const s of STATION_POS) {
      const dist = Math.hypot(g.position.x - s.x, g.position.z - s.z)
      if (dist < zd) {
        zd = dist
        zone = s.id
      }
    }
    if (zone !== lastZone.current) {
      lastZone.current = zone
      if (zone) useStore.getState().notify(zone)
    }
  })

  return <Avatar groupRef={groupRef} bodyRef={bodyRef} />
}
