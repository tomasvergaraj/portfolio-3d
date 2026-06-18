import * as THREE from 'three'

// Posición del personaje en el mundo, compartida sin re-renders. El Player la
// escribe cada frame; otros sistemas (pasto reactivo, etc.) la leen.
export const playerPos = new THREE.Vector3(0, 0.5, 6)
