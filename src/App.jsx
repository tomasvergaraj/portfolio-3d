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
import { useKeyboard } from './controls/useKeyboard'
import { useStore } from './store'

export default function App() {
  useKeyboard()
  const reduce = useReducedMotion()
  const [menu, setMenu] = useState(false)
  const openStation = useStore((s) => s.open)

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
        dpr={[1, 2]}
        camera={{ position: [0, 12.5, 22], fov: 42, near: 0.1, far: 220 }}
        gl={{ antialias: false, powerPreference: 'high-performance' }}
        onPointerMissed={() => useStore.getState().close()}
      >
        <Suspense fallback={null}>
          <Scene reducedMotion={reduce} />
        </Suspense>
      </Canvas>

      <Hud onOpenMenu={() => setMenu(true)} />
      <Notification />
      <Joystick />
      <SectionMenu openMenu={menu} setOpenMenu={setMenu} onPick={openStation} />
      <StationPanel />
      <Loader />
      <AudioToggle />
    </>
  )
}
