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
// sobre lo muy brillante (faros, luciérnagas), un gradeo de color con algo más de
// cuerpo (contraste + saturación) da viveza cinematográfica, y la viñeta cierra
// los bordes. Color grade afinado para acercarse al contraste rico del folio sin
// quemar ni saturar de más.
export function Effects() {
  return (
    <EffectComposer disableNormalPass multisampling={0}>
      <SMAA />
      <Bloom intensity={0.92} luminanceThreshold={0.68} luminanceSmoothing={0.26} mipmapBlur radius={0.75} />
      <BrightnessContrast brightness={0.012} contrast={0.135} />
      <HueSaturation saturation={0.16} hue={0} />
      <Vignette offset={0.28} darkness={0.66} eskil={false} />
    </EffectComposer>
  )
}
