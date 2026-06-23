import React from 'react'
import { Html } from '@react-three/drei'

// Etiqueta flotante con el nombre de la mascota. Aparece al pasar el mouse o al
// enfocarla (clic). Mismo lenguaje visual que las etiquetas de estación, pero más
// compacta. Va en el grupo EXTERNO de la mascota (sin escala) para quedar a la
// altura correcta sobre su cabeza.
export function PetLabel({ name, y = 1.45, show }) {
  if (!show) return null
  return (
    <Html position={[0, y, 0]} center distanceFactor={13} occlude={false} pointerEvents="none">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 11px',
          borderRadius: 11,
          whiteSpace: 'nowrap',
          background: 'var(--ink)',
          color: '#fff',
          border: '1px solid var(--ink)',
          boxShadow: '0 10px 24px -14px rgba(20,30,46,0.6)',
          fontFamily: '"Space Grotesk", sans-serif',
          fontWeight: 600,
          fontSize: 13,
          userSelect: 'none',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: '#ffd23f',
            boxShadow: '0 0 0 2px rgba(255,210,63,0.28)',
            flex: 'none',
          }}
        />
        {name}
      </div>
    </Html>
  )
}
