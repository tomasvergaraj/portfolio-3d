import * as THREE from 'three'

// Posición del personaje en el mundo, compartida sin re-renders. El Player la
// escribe cada frame; otros sistemas (pasto reactivo, polvo, etc.) la leen.
export const playerPos = new THREE.Vector3(0, 0.5, 6)

// Estado de movimiento del personaje (también compartido sin re-renders).
// `jumping` es true mientras está en el aire (la altura la da la física, porque el
// root motion del clip de salto no se aplica a este rig); `jumpId` se incrementa al
// iniciar cada salto (el avatar lo observa para disparar la animación una vez).
export const playerMotion = { moving: false, sprint: false, jumping: false, jumpId: 0 }
