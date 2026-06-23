import React, { Suspense, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { useReducedMotion } from 'motion/react'
import { Scene } from './world/Scene'
import { Hud } from './ui/Hud'
import { Joystick } from './ui/Joystick'
import { SectionMenu } from './ui/SectionMenu'
import { StationPanel } from './ui/StationPanel'
import { Loader } from './ui/Loader'
import { AudioToggle } from './ui/AudioToggle'
import { Notification } from './ui/Notification'
import { Achievement } from './ui/Achievement'
import { useKeyboard } from './controls/useKeyboard'
import { useKonami } from './controls/useKonami'
import { useDeepLinks } from './useDeepLinks'
import { fanfare } from './audio/sound'
import { useStore } from './store'
import { STATIONS } from './data/stations'

export default function App() {
  useKeyboard()
  useDeepLinks()
  // Easter egg: el código Konami suelta una ráfaga de confeti + fanfarria.
  useKonami(() => {
    useStore.getState().celebrate()
    fanfare()
  })
  const reduce = useReducedMotion()
  const [menu, setMenu] = useState(false)
  const openStation = useStore((s) => s.open)
  const visited = useStore((s) => s.visited)

  // Logro de exploración: al visitar (abrir) las 5 secciones se desbloquea una
  // vez por sesión, con su toast, una ráfaga de confeti y la fanfarria. Idea del
  // folio de Bruno Simon (recompensar el recorrer el mundo entero).
  useEffect(() => {
    if (visited.length < STATIONS.length) return
    const s = useStore.getState()
    if (s.achievementN !== 0) return
    s.unlockAchievement()
    s.celebrate()
    fanfare()
  }, [visited])

  // Detección de dispositivo táctil para mostrar el joystick.
  useEffect(() => {
    const coarse =
      window.matchMedia?.('(pointer: coarse)').matches || 'ontouchstart' in window
    if (coarse) document.body.classList.add('has-touch')
  }, [])

  return (
    <>
      <Canvas
        shadows="soft"
        dpr={[1, 1.5]}
        camera={{ position: [0, 12.5, 22], fov: 42, near: 0.1, far: 220 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onPointerMissed={() => {
          const s = useStore.getState()
          s.close()
          s.clearFocusPet()
        }}
      >
        <Suspense fallback={null}>
          <Scene reducedMotion={reduce} />
        </Suspense>
      </Canvas>

      <Hud onOpenMenu={() => setMenu(true)} />
      <Notification />
      <Achievement />
      <Joystick />
      <SectionMenu openMenu={menu} setOpenMenu={setMenu} onPick={openStation} />
      <StationPanel />
      <Loader />
      <AudioToggle />
    </>
  )
}
