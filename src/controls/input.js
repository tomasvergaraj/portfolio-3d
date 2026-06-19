// Estado de entrada compartido (mutable, leído cada frame por el Player).
// El teclado y el joystick táctil escriben en el mismo lugar.

export const keys = new Set()

// Vector del joystick, normalizado en el rango [-1, 1]. `boost` lo activa el
// joystick al empujarlo a fondo (equivalente táctil del Shift).
export const touch = { x: 0, z: 0, boost: false, jump: false }

// Devuelve la dirección deseada combinando teclado + joystick.
// Ejes: x = izquierda/derecha, z = adelante(-)/atrás(+).
export function readInput() {
  let x = 0
  let z = 0
  if (keys.has('w') || keys.has('arrowup')) z -= 1
  if (keys.has('s') || keys.has('arrowdown')) z += 1
  if (keys.has('a') || keys.has('arrowleft')) x -= 1
  if (keys.has('d') || keys.has('arrowright')) x += 1
  x += touch.x
  z += touch.z
  const len = Math.hypot(x, z)
  if (len > 1) {
    x /= len
    z /= len
  }
  const sprint = keys.has('shift') || touch.boost
  // Salto: barra espaciadora (teclado) o botón táctil.
  const jump = keys.has(' ') || touch.jump
  return { x, z, moving: len > 0.06, sprint, jump }
}
