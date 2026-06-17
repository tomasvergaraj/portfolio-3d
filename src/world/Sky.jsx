import React, { useMemo } from 'react'
import * as THREE from 'three'

// Domo de cielo con gradiente vertical (cenit → horizonte). Reemplaza al color
// plano del fondo y da profundidad atmosférica sin depender del HDRI del CDN.
// Es un ShaderMaterial propio, así que la niebla de la escena no lo afecta:
// el horizonte queda claro y los objetos lejanos funden hacia él.
export function Sky({
  top = '#4f93dd',
  horizon = '#dbeaf3',
  exponent = 0.62,
}) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        uniforms: {
          uTop: { value: new THREE.Color(top) },
          uHorizon: { value: new THREE.Color(horizon) },
          uExponent: { value: exponent },
        },
        vertexShader: /* glsl */ `
          varying vec3 vWorldPosition;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPosition = wp.xyz;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uTop;
          uniform vec3 uHorizon;
          uniform float uExponent;
          varying vec3 vWorldPosition;
          void main() {
            float h = normalize(vWorldPosition).y;
            float t = pow(clamp(h, 0.0, 1.0), uExponent);
            gl_FragColor = vec4(mix(uHorizon, uTop, t), 1.0);
          }
        `,
      }),
    [top, horizon, exponent]
  )

  return (
    <mesh material={material} scale={200} frustumCulled={false}>
      <sphereGeometry args={[1, 32, 16]} />
    </mesh>
  )
}
