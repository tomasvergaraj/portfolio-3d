import React from 'react'
import { Instance, preloadModel } from './props'

// ─────────────────────────────────────────────────────────────────────────
// Monumento 3D por estación: { url, h } donde h es el alto objetivo (u). El
// modelo se auto-escala a esa altura y se apoya en el suelo. Si una estación no
// está en el mapa, StationMarker usa el monumento de primitivas.
const STATION_MODEL = {
  sobre: { url: '/House.glb', h: 2.8 },
  proyectos: { url: '/laptop.glb', h: 1.8, rot: [-Math.PI / 2, 0, 0] },
  stack: { url: '/crystal_26.fbx', h: 2.6 },
  experiencia: { url: '/WatchTower_SecondAge_Level3.fbx', h: 4.6 },
  contacto: { url: '/Mailbox.glb', h: 1.6 },
}

export const hasStationModel = (id) => !!STATION_MODEL[id]

export function StationModel({ id }) {
  const m = STATION_MODEL[id]
  if (!m) return null
  // El grupo de StationMarker ya está en la posición de la estación (y=0); aquí
  // solo apoyamos el modelo sobre el suelo en el origen local.
  return <Instance url={m.url} position={[0, 0, 0]} targetH={m.h} rot={m.rot} />
}

for (const m of Object.values(STATION_MODEL)) preloadModel(m.url)
