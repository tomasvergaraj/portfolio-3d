import * as THREE from 'three'

// Posición en el mundo de cada mascota (deambulante), compartida sin re-renders.
// Cada mascota la escribe cada frame; la cámara la lee para hacer zoom al hacer
// clic en una de ellas.
export const petPos = {
  bruna: new THREE.Vector3(),
  pascual: new THREE.Vector3(),
}
