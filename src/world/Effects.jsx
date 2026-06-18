import React from 'react'
import {
  EffectComposer,
  Bloom,
  Vignette,
  BrightnessContrast,
  HueSaturation,
  SMAA,
} from '@react-three/postprocessing'

// Postproceso: SMAA suaviza bordes (el Canvas va sin antialias), el bloom prende
// sobre lo muy brillante (faros, luciérnagas), un gradeo de color sutil da más
// contraste y viveza, y la viñeta cierra los bordes con sensación cinematográfica.
export function Effects() {
  return (
    <EffectComposer disableNormalPass multisampling={0}>
      <SMAA />
      <Bloom intensity={0.85} luminanceThreshold={0.7} luminanceSmoothing={0.25} mipmapBlur radius={0.7} />
      <BrightnessContrast brightness={0.01} contrast={0.1} />
      <HueSaturation saturation={0.12} hue={0} />
      <Vignette offset={0.3} darkness={0.6} eskil={false} />
    </EffectComposer>
  )
}
