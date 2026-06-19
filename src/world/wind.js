import * as THREE from 'three'

// Viento global del mundo: un único vector (dirección en el plano XZ + fuerza de
// racha) que varía suavemente con el tiempo. Lo leen el pasto, las hojas y el
// polvo para que todo se mueva de forma COHERENTE — la misma idea que en el folio
// de Bruno Simon, donde un sistema de clima gobierna las partículas de viento.
//
// En vez de montar un componente con su propio useFrame (cuyo orden respecto a
// los consumidores no está garantizado), exponemos `sampleWind(t)`: recalcula el
// estado a lo sumo una vez por frame y devuelve el mismo objeto cacheado al
// resto de llamadas con el mismo tiempo. Así el orden de los useFrame da igual.
export const wind = {
  dirX: 1, // dirección unitaria del viento (plano XZ)
  dirZ: 0,
  strength: 0.5, // fuerza de la racha, 0..1
}

let _lastT = -1

export function sampleWind(t) {
  if (t === _lastT) return wind
  _lastT = t

  // La dirección deriva muy lentamente (giro suave); combinamos una oscilación
  // lenta con una deriva monótona para que nunca se sienta mecánica ni se quede
  // soplando siempre hacia el mismo lado.
  const angle = Math.sin(t * 0.045) * 0.7 + t * 0.018
  wind.dirX = Math.cos(angle)
  wind.dirZ = Math.sin(angle)

  // Fuerza en rachas: dos senos de distinto periodo se suman para dar un pulso
  // orgánico (sube y baja sin patrón obvio). Acotado para que nunca se anule del
  // todo ni se dispare.
  const gust = 0.52 + 0.32 * Math.sin(t * 0.5) + 0.16 * Math.sin(t * 1.27 + 1.7)
  wind.strength = THREE.MathUtils.clamp(gust, 0.1, 1)

  return wind
}
