import React, { useRef, useState, useEffect, useMemo, useLayoutEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleHeight } from './terrain'
import { petPos } from './petState'
import { useStore } from '../store'
import { PetLabel } from './PetLabel'

// "Bruna": una perra que deambula por la isla con su animación de caminar real
// (modelo antiguo dog_walk.glb). Mismo comportamiento errante que Pascual: elige
// destinos al azar, camina hacia ellos y al llegar descansa, repitiendo. Al pasar
// el mouse muestra su nombre; al hacer clic la cámara hace zoom hacia ella.
const URL = '/dog_walk.glb'
// El Armature del glb trae un scale interno de 0.01: el bbox del skinned mesh no
// es fiable, así que la escala se fija a mano. El clip "Unreal Take" tenía el
// hueso raíz (Hips) con escala constante 0.76 → la perra se ENCOGÍA al caminar y
// recuperaba tamaño en reposo. Quitamos las pistas de escala del clip (abajo) y
// compensamos la escala (320 × 0.76 ≈ 243) para conservar el tamaño bueno.
const SCALE = 243
// El modelo mira a +x; restamos π/2 al rumbo para que el hocico apunte al avance.
const FACE_OFFSET = Math.PI / 2

const WALK_SPEED = 2.7 // u/s (trote de perro, algo más vivo que el gato)
const ANIM_TS = 1.25 // velocidad del clip de caminar
const WANDER_MIN = 5
const WANDER_MAX = 17
const ARRIVE = 0.7
const TURN = 0.14
const FADE = 0.25
const PAUSE_MIN = 1.2
const PAUSE_MAX = 4

function lerpAngle(a, b, t) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

export function Bruna() {
  const group = useRef()
  const breath = useRef()
  // Una sola instancia: escena directa (clonar un skinned mesh rompe el esqueleto).
  const { scene, animations } = useGLTF(URL)
  // Quita las pistas de escala del clip (la de Hips encogía a la perra al
  // caminar); conserva traslación y rotación, que dan la marcha.
  const clips = useMemo(
    () =>
      animations.map((c) => {
        const cl = c.clone()
        cl.tracks = cl.tracks.filter((t) => !t.name.endsWith('.scale'))
        return cl
      }),
    [animations]
  )
  const { actions } = useAnimations(clips, group)
  const walk = useRef(null)
  const st = useRef({ mode: 'pause', tx: 0, tz: 0, timer: 1, walking: false })
  const phase = useMemo(() => Math.random() * Math.PI * 2, [])
  const [hovered, setHovered] = useState(false)
  const focused = useStore((s) => s.focusPet === 'bruna')
  const modalOpen = useStore((s) => s.active !== null)

  useLayoutEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true
        o.receiveShadow = false
        o.frustumCulled = false
      }
    })
  }, [scene])

  const pickTarget = () => {
    const ang = Math.random() * Math.PI * 2
    const r = WANDER_MIN + Math.random() * (WANDER_MAX - WANDER_MIN)
    st.current.tx = Math.cos(ang) * r
    st.current.tz = Math.sin(ang) * r
  }

  useEffect(() => {
    const a = Object.values(actions)[0]
    walk.current = a
    a?.setLoop(THREE.LoopRepeat, Infinity)
    // Aparece en un punto al azar (distinto del gato para que no nazcan juntos).
    const ang = Math.random() * Math.PI * 2
    const r = WANDER_MIN + Math.random() * (WANDER_MAX - WANDER_MIN)
    const sx = Math.cos(ang) * r
    const sz = Math.sin(ang) * r
    group.current?.position.set(sx, sampleHeight(sx, sz), sz)
    if (group.current) group.current.rotation.y = Math.random() * Math.PI * 2
    st.current.timer = 0.6 + Math.random() * 1.6
    return () => a?.stop()
  }, [actions])

  useFrame((state, dt) => {
    const g = group.current
    const a = walk.current
    if (!g) return
    const d = Math.min(dt, 0.05)
    const s = st.current
    const t = state.clock.elapsedTime

    // Asienta sobre el relieve y comparte su posición (para el zoom de cámara).
    g.position.y = sampleHeight(g.position.x, g.position.z)
    petPos.bruna.copy(g.position)

    // Respiración: leve sube/baja del pecho, marcada en reposo (que no se sienta
    // estática) y tenue al caminar (ahí la marcha ya da vida).
    if (breath.current) {
      const rest = s.mode === 'pause' ? 1 : 0.3
      const b = rest * 0.045 * (0.5 + 0.5 * Math.sin(t * 1.8 + phase))
      breath.current.scale.set(1 - b * 0.5, 1 + b, 1 - b * 0.5)
    }

    if (s.mode === 'pause') {
      if (a && s.walking) {
        a.fadeOut(FADE)
        s.walking = false
      }
      s.timer -= d
      if (s.timer <= 0) {
        pickTarget()
        s.mode = 'walk'
      }
      return
    }

    const dx = s.tx - g.position.x
    const dz = s.tz - g.position.z
    const dist = Math.hypot(dx, dz)
    if (dist < ARRIVE) {
      s.mode = 'pause'
      s.timer = PAUSE_MIN + Math.random() * (PAUSE_MAX - PAUSE_MIN)
      return
    }
    const nx = dx / dist
    const nz = dz / dist
    g.position.x += nx * WALK_SPEED * d
    g.position.z += nz * WALK_SPEED * d
    g.rotation.y = lerpAngle(g.rotation.y, Math.atan2(nx, nz) - Math.PI / 2, TURN)
    if (a && !s.walking) {
      a.reset().fadeIn(FADE).play()
      a.setEffectiveTimeScale(ANIM_TS)
      s.walking = true
    }
  })

  return (
    <group
      ref={group}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation()
        useStore.getState().setFocusPet('bruna')
      }}
    >
      <group ref={breath}>
        <group scale={SCALE} rotation={[0, FACE_OFFSET, 0]}>
          <primitive object={scene} />
        </group>
      </group>
      <PetLabel name="Bruna" show={(hovered || focused) && !modalOpen} />
    </group>
  )
}

useGLTF.preload(URL)
