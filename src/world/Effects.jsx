import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { playerPos } from './playerState'
import {
  EffectComposer,
  DepthOfField,
  Bloom,
  Vignette,
  BrightnessContrast,
  HueSaturation,
  SMAA,
} from '@react-three/postprocessing'

// Postproceso: SMAA suaviza bordes (el Canvas va sin antialias), el bloom prende
// sobre lo muy brillante (faros, luciérnagas), un gradeo de color con algo más de
// cuerpo (contraste + saturación) da viveza cinematográfica, y la viñeta cierra
// los bordes. Color grade afinado para acercarse al contraste rico del folio sin
// quemar ni saturar de más.
export function Effects() {
  // Punto de foco del DoF: sigue al avatar (su torso) cada frame, así el foco se
  // mantiene en el sujeto en seguimiento, en la órbita en reposo y al acercarse a
  // una estación, en vez de quedar clavado a una distancia fija.
  const focus = useRef(new THREE.Vector3(0, 1.3, 6))
  useFrame(() => {
    focus.current.set(playerPos.x, playerPos.y + 0.8, playerPos.z)
  })
  return (
    <EffectComposer disableNormalPass multisampling={0}>
      {/* Profundidad de campo: enfoca al sujeto y desenfoca apenas el primer plano
          cercano y el agua/horizonte lejano — look de diorama. Desenfoque contenido
          para no fundir la escena. */}
      <DepthOfField target={focus.current} worldFocusRange={19} bokehScale={2.4} />
      <SMAA />
      <Bloom intensity={0.92} luminanceThreshold={0.68} luminanceSmoothing={0.26} mipmapBlur radius={0.75} />
      <BrightnessContrast brightness={0.012} contrast={0.135} />
      <HueSaturation saturation={0.16} hue={0} />
      <Vignette offset={0.28} darkness={0.66} eskil={false} />
    </EffectComposer>
  )
}
