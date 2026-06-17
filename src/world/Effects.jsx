import React from 'react'
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing'

// El bloom solo prende sobre lo muy brillante (los faros emisivos, que tienen
// toneMapped=false y emissiveIntensity alta). La viñeta cierra los bordes y da
// sensación de profundidad sin oscurecer el centro.
export function Effects() {
  return (
    <EffectComposer disableNormalPass>
      <Bloom
        intensity={0.85}
        luminanceThreshold={0.7}
        luminanceSmoothing={0.25}
        mipmapBlur
        radius={0.7}
      />
      <Vignette offset={0.32} darkness={0.55} eskil={false} />
    </EffectComposer>
  )
}
