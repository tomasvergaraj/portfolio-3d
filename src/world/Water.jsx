import React, { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sampleWind } from './wind'
import { SHORE_R, WATER_Y } from './terrain'

// Agua con shader propio (clásico, como Sky.jsx). Las olas se calculan en la GPU
// con varios trenes Gerstner (crestas afiladas, valles redondeados) abanicados
// alrededor del VIENTO global, así que el oleaje viaja de forma coherente con el
// pasto, las hojas y el polvo. La normal se reconstruye plana por fragmento
// (facetas low-poly, como el resto del mundo). El color va por profundidad
// (aqua en la orilla → azul mar adentro), con destello especular del sol y una
// ESPUMA DE ORILLA que entra y sale con el tiempo (rompiente orgánica).
const SIZE = 240
const SEG = 96

// Dirección del sol = la key direccional de la escena ([16,13,7]). Mantenerla en
// sintonía hace que el camino de destellos caiga hacia el mismo sol que proyecta
// las sombras.
const SUN = new THREE.Vector3(16, 13, 7).normalize()

export function Water({ animate = true }) {
  const material = useMemo(() => {
    const m = new THREE.ShaderMaterial({
      transparent: true,
      extensions: { derivatives: true }, // dFdx/dFdy para la normal plana
      uniforms: {
        uTime: { value: 0 },
        uWindDir: { value: new THREE.Vector2(1, 0) },
        uStrength: { value: 0.5 },
        uSun: { value: SUN.clone() },
        uSunCol: { value: new THREE.Color('#ffdca0') }, // destello cálido del sol
        uShoreR: { value: SHORE_R },
        uShallow: { value: new THREE.Color('#6fd0c8') },
        uDeep: { value: new THREE.Color('#1f5f86') },
        uFoam: { value: new THREE.Color('#eaf6f6') },
      },
      vertexShader: /* glsl */ `
        uniform float uTime;
        uniform vec2 uWindDir;
        uniform float uStrength;
        varying vec3 vWorldPos;
        varying float vCrest;

        vec2 rot(vec2 v, float a){ float c=cos(a), s=sin(a); return vec2(c*v.x - s*v.y, s*v.x + c*v.y); }

        // Un tren Gerstner: empuja el vértice horizontalmente hacia la cresta
        // (crestas afiladas) y lo sube en seno. Devuelve el alto y acumula el
        // desplazamiento horizontal en 'off'.
        float gerstner(vec2 p, vec2 dir, float k, float speed, float amp, float steep, inout vec2 off){
          float ph = dot(dir, p) * k - uTime * speed;
          float c = cos(ph);
          off += dir * (steep * amp * c);
          return amp * sin(ph);
        }

        void main(){
          vec3 wp = (modelMatrix * vec4(position, 1.0)).xyz;
          vec2 p = wp.xz;
          vec2 wd = normalize(uWindDir);
          float amp = 0.085 + uStrength * 0.07;
          vec2 off = vec2(0.0);
          float h = 0.0;
          // Cuatro trenes abanicados alrededor del viento, con longitudes y
          // velocidades distintas para que el patrón no se vea en bandas.
          h += gerstner(p, rot(wd,  0.00), 0.30, 1.05, amp * 1.00, 0.9, off);
          h += gerstner(p, rot(wd,  0.85), 0.46, 1.35, amp * 0.60, 0.8, off);
          h += gerstner(p, rot(wd, -0.65), 0.62, 1.70, amp * 0.42, 0.7, off);
          h += gerstner(p, rot(wd,  2.20), 0.22, 0.80, amp * 0.55, 0.9, off);
          // Rizo fino (sin desplazamiento horizontal).
          h += sin(p.x * 0.9 + uTime * 1.7) * 0.018 + sin(p.y * 1.05 - uTime * 1.3) * 0.018;

          wp.xz += off;
          wp.y += h;
          vWorldPos = wp;
          vCrest = h;
          gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform float uTime;
        uniform float uShoreR;
        uniform vec3 uSun;
        uniform vec3 uSunCol;
        uniform vec3 uShallow;
        uniform vec3 uDeep;
        uniform vec3 uFoam;
        varying vec3 vWorldPos;
        varying float vCrest;

        void main(){
          // Normal plana por fragmento (facetas low-poly).
          vec3 n = normalize(cross(dFdx(vWorldPos), dFdy(vWorldPos)));
          float r = length(vWorldPos.xz);

          // Color por profundidad: aqua junto a la orilla → azul mar adentro.
          float depth = smoothstep(uShoreR, uShoreR + 55.0, r);
          vec3 col = mix(uShallow, uDeep, depth);

          // Luz difusa suave + ambiente.
          vec3 L = normalize(uSun);
          float diff = clamp(dot(n, L), 0.0, 1.0);
          col *= 0.66 + 0.42 * diff;

          // Reflejo del sol sobre el agua: un camino de destellos hacia el sol.
          // Halo ancho (el "sendero" alargado) + chispas finas que titilan (mar
          // que brilla). Ambas con el color cálido del sol; sólo aparecen en la
          // zona donde la reflexión apunta al sol, así que forman el sendero.
          vec3 V = normalize(cameraPosition - vWorldPos);
          vec3 H = normalize(L + V);
          float ndh = clamp(dot(n, H), 0.0, 1.0);
          float glow = pow(ndh, 14.0);
          float tw = 0.5 + 0.5 * sin(vWorldPos.x * 3.3 + vWorldPos.z * 4.1 + uTime * 7.0);
          float glint = pow(ndh, 150.0) * (0.35 + 0.65 * tw);
          col += uSunCol * (glow * 0.45 + glint * 2.0);

          // Espuma: en las crestas + una banda de rompiente en la orilla que
          // entra y sale con el tiempo y se rompe con una onda que la recorre.
          float crest = smoothstep(0.15, 0.27, vCrest);
          float shoreLine = uShoreR + sin(uTime * 0.8) * 0.7;
          float band = 1.0 - smoothstep(0.0, 2.6, abs(r - shoreLine));
          float wash = 0.5 + 0.5 * sin(uTime * 1.6 - r * 0.6);
          float foam = clamp(crest * 0.38 + band * wash * 0.95, 0.0, 1.0);
          col = mix(col, uFoam, foam * 0.85);

          gl_FragColor = vec4(col, 0.95);
        }
      `,
    })
    return m
  }, [])

  const geo = useMemo(() => new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG), [])

  useFrame((state) => {
    const u = material.uniforms
    const t = state.clock.elapsedTime
    u.uTime.value = animate ? t : 0
    const w = sampleWind(t)
    u.uWindDir.value.set(w.dirX, w.dirZ)
    u.uStrength.value = animate ? w.strength : 0.4
  })

  return (
    <mesh
      geometry={geo}
      material={material}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, WATER_Y, 0]}
    />
  )
}
