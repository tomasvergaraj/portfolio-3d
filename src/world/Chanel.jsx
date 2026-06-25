import React, { useRef, useState, useEffect, useMemo, useLayoutEffect } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleHeight } from './terrain'
import { petPos } from './petState'
import { useStore } from '../store'
import { PetLabel } from './PetLabel'

// "Chanel": una gata que deambula por la isla con su animación de caminar real.
// Mismo comportamiento errante que Pascual y Bruna: elige destinos al azar, camina
// hacia ellos y al llegar descansa, repitiendo. Respira en reposo (escala no
// uniforme sutil). Al pasar el mouse muestra su nombre; al hacer clic la cámara
// hace zoom hacia ella.
//
// El modelo viene de un FBX de Meshy (mismo pipeline Unreal que la perra). Se
// convirtió a GLB y se comprimió (scripts/convert-chanel → optimize-avatar →
// retex-chanel → public/chanel-v2.glb). La textura base son SUS COLORES
// ORIGINALES (atigrados) horneados como PNG SIN PÉRDIDA a 1536: el JPEG metía
// bloques 8x8 ("colores cuadrados") sobre el pelaje camo de alta frecuencia, y
// bajar la resolución/aplanar el manto lo empeoraba. Como la perra, el clip
// "Unreal Take" trae pistas de ESCALA en los
// huesos (Hips con escala constante) que ENCOGEN al animar → se eliminan abajo y
// la marcha se conserva (traslación + rotación).
// Nombre versionado (-v2): fuerza recarga del asset (useGLTF y el navegador
// cachean por URL; al cambiar la textura, el archivo viejo quedaba en caché).
const URL = '/chanel-v2.glb'
// El bbox de bind incluye la cola levantada → infla el alto. TARGET_H ajusta el
// tamaño en el mundo (la gata es algo más pequeña que la perra y que Pascual).
const TARGET_H = 1.05 // alto objetivo de la gata (auto-escala desde el bbox de bind)
// El modelo mira nativamente a +z (verificado en el visor), igual que Pascual:
// el rumbo se aplica directo, sin desfase.
const FACE_OFFSET = 0

// El sol cálido del mundo (intensity 1.7) + el bloom (umbral 0.68) quemaban los
// parches CLAROS de su pelaje atigrado → se veía "disparejo"/amarillo en el mundo
// (aunque en luz neutra está bien). Atenuamos el albedo para que el patrón original
// se lea sin quemarse, como en la textura original.
const ALBEDO = 0.6 // multiplicador de color del manto (1 = textura tal cual)

const WALK_SPEED = 1.9 // u/s (paso de gato, algo más calmo que la perra)
const ANIM_TS = 1.1 // velocidad del clip de caminar
const WANDER_MIN = 4
const WANDER_MAX = 16
const ARRIVE = 0.6
const TURN = 0.12
const FADE = 0.25
const PAUSE_MIN = 1.6
const PAUSE_MAX = 4.8

function lerpAngle(a, b, t) {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * t
}

export function Chanel() {
  const group = useRef()
  const breath = useRef()
  // Una sola instancia: escena directa (clonar un skinned mesh rompe el esqueleto).
  const { scene, animations } = useGLTF(URL)
  // Quita las pistas de escala del clip (encogían a la gata al caminar); conserva
  // traslación y rotación, que dan la marcha.
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
  const focused = useStore((s) => s.focusPet === 'chanel')
  const modalOpen = useStore((s) => s.active !== null)

  // Auto-ajuste: escala a TARGET_H y apoya las patas en el suelo (bbox de bind).
  const { scale, lift } = useMemo(() => {
    scene.updateWorldMatrix(true, true)
    const box = new THREE.Box3().setFromObject(scene)
    const size = new THREE.Vector3()
    box.getSize(size)
    const s = TARGET_H / (size.y || 1)
    return { scale: s, lift: -box.min.y }
  }, [scene])

  useLayoutEffect(() => {
    scene.traverse((o) => {
      if (o.isMesh || o.isSkinnedMesh) {
        o.castShadow = true
        o.receiveShadow = false
        o.frustumCulled = false
        // Textura base ya horneada en el GLB; la dejamos mate (sin brillo) para
        // que cuadre con el resto del mundo low-poly. Clonamos el material para
        // no tocar la caché de useGLTF.
        if (o.material) {
          o.material = o.material.clone()
          o.material.metalness = 0
          o.material.roughness = 1
          o.material.color.setScalar(ALBEDO) // atenúa para no quemarse bajo el sol
          o.material.needsUpdate = true
        }
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
    // Aparece en un punto al azar (distinto de los otros para que no nazcan juntos).
    const ang = Math.random() * Math.PI * 2
    const r = WANDER_MIN + Math.random() * (WANDER_MAX - WANDER_MIN)
    const sx = Math.cos(ang) * r
    const sz = Math.sin(ang) * r
    group.current?.position.set(sx, sampleHeight(sx, sz), sz)
    if (group.current) group.current.rotation.y = Math.random() * Math.PI * 2
    st.current.timer = 0.7 + Math.random() * 1.7
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
    petPos.chanel.copy(g.position)

    // Respiración: leve sube/baja del pecho, marcada en reposo (que no se sienta
    // estática) y tenue al caminar (ahí la marcha ya da vida).
    if (breath.current) {
      const rest = s.mode === 'pause' ? 1 : 0.3
      const b = rest * 0.04 * (0.5 + 0.5 * Math.sin(t * 2.0 + phase))
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
    g.rotation.y = lerpAngle(g.rotation.y, Math.atan2(nx, nz) + FACE_OFFSET, TURN)
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
        useStore.getState().setFocusPet('chanel')
      }}
    >
      <group ref={breath}>
        <group scale={scale}>
          <primitive object={scene} position={[0, lift, 0]} />
        </group>
      </group>
      <PetLabel name="Chanel" show={(hovered || focused) && !modalOpen} />
    </group>
  )
}

useGLTF.preload(URL)
