import React, { useEffect, useState } from 'react'
import { useStore } from '../store'
import { startAudio, blip, chord, setMuted } from '../audio/sound'

// Arranca el audio tras el primer gesto, dispara SFX según el estado del mundo
// y muestra un botón para silenciar.
export function AudioToggle() {
  const [muted, setMutedState] = useState(() => {
    try {
      return localStorage.getItem('nx-muted') === '1'
    } catch {
      return false
    }
  })
  const nearby = useStore((s) => s.nearby)
  const active = useStore((s) => s.active)

  // Aplica el estado de mute al motor al montar y al cambiar.
  useEffect(() => {
    setMuted(muted)
    try {
      localStorage.setItem('nx-muted', muted ? '1' : '0')
    } catch {}
  }, [muted])

  // Inicia el contexto de audio con el primer gesto del usuario.
  useEffect(() => {
    const go = () => startAudio()
    const opts = { once: true }
    window.addEventListener('pointerdown', go, opts)
    window.addEventListener('keydown', go, opts)
    window.addEventListener('touchstart', go, opts)
    return () => {
      window.removeEventListener('pointerdown', go)
      window.removeEventListener('keydown', go)
      window.removeEventListener('touchstart', go)
    }
  }, [])

  // SFX: blip al acercarse a una estación, acorde al abrir una sección.
  useEffect(() => {
    if (nearby) blip()
  }, [nearby])
  useEffect(() => {
    if (active) chord()
  }, [active])

  return (
    <button
      onClick={() => setMutedState((m) => !m)}
      aria-label={muted ? 'Activar sonido' : 'Silenciar'}
      title={muted ? 'Activar sonido' : 'Silenciar'}
      style={{
        position: 'fixed',
        left: 16,
        bottom: 16,
        width: 40,
        height: 40,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 12,
        background: 'rgba(251,248,242,0.92)',
        color: 'var(--ink)',
        border: '1px solid var(--line)',
        boxShadow: '0 10px 26px -14px rgba(20,30,46,0.5)',
        cursor: 'pointer',
        zIndex: 20,
      }}
    >
      {muted ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H3v6h3l5 4z" />
          <line x1="23" y1="9" x2="17" y2="15" />
          <line x1="17" y1="9" x2="23" y2="15" />
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 5 6 9H3v6h3l5 4z" />
          <path d="M15.5 8.5a5 5 0 0 1 0 7" />
          <path d="M18.5 5.5a9 9 0 0 1 0 13" />
        </svg>
      )}
    </button>
  )
}
