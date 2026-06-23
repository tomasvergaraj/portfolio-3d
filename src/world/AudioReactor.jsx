import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { playerPos, playerMotion } from './playerState'
import { sampleWind } from './wind'
import { footstep, jumpSfx, landSfx, setWindLevel } from '../audio/sound'

// Puente mundo → audio: corre en el frame loop y dispara SFX según el estado del
// jugador, y modula el viento ambiental con la racha global. No produce nada
// hasta que el audio arranca (primer gesto) ni si está silenciado: las funciones
// de sound.js son no-op en ese caso, así que esto es seguro siempre.
const STEP_DIST = 0.85 // igual criterio que las huellas (FootTrail)

export function AudioReactor() {
  const s = useRef({ x: playerPos.x, z: playerPos.z, acc: 0, jumpId: 0, jumping: false, windT: 0 })

  useFrame((state, dt) => {
    const d = Math.min(dt, 0.05)
    const r = s.current

    // Pasos por distancia recorrida (no suenan en el aire durante el salto).
    const dx = playerPos.x - r.x
    const dz = playerPos.z - r.z
    r.x = playerPos.x
    r.z = playerPos.z
    if (playerMotion.moving && !playerMotion.jumping) {
      r.acc += Math.hypot(dx, dz)
      if (r.acc >= STEP_DIST) {
        r.acc = 0
        footstep(playerMotion.sprint)
      }
    }

    // Salto (flanco de jumpId) y aterrizaje (jumping true → false).
    if (playerMotion.jumpId !== r.jumpId) {
      r.jumpId = playerMotion.jumpId
      jumpSfx()
    }
    if (r.jumping && !playerMotion.jumping) landSfx()
    r.jumping = playerMotion.jumping

    // Viento de audio sigue al viento global (cada ~0.3 s, no cada frame).
    r.windT += d
    if (r.windT > 0.3) {
      r.windT = 0
      setWindLevel(sampleWind(state.clock.elapsedTime).strength)
    }
  })

  return null
}
