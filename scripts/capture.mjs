// Captura screenshots del portafolio 3D para revisión visual del loop de mejoras.
// Usa el Chrome del sistema (channel: 'chrome') porque la descarga del Chromium
// de Playwright está bloqueada por la inspección SSL del proxy corporativo.
//
// Uso:
//   node scripts/capture.mjs                 # captura sobre http://localhost:5173
//   node scripts/capture.mjs http://host:5173 ./screenshots/iterN
//
// Genera, en el directorio de salida:
//   01-mundo.png   vista inicial del mundo
//   02-camina.png  tras mover el avatar hacia adelante (cámara + caminar)
//   03-panel.png   con un panel de estación abierto (capa de UI)

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'

const URL = process.argv[2] || 'http://localhost:5173'
const OUT = process.argv[3] || './screenshots/latest'

const SETTLE_MS = 6000 // tiempo para que carguen HDRI + fuentes + primer render

async function main() {
  await mkdir(OUT, { recursive: true })

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: [
      '--use-gl=angle',
      '--use-angle=swiftshader',
      '--enable-unsafe-swiftshader',
      '--ignore-gpu-blocklist',
    ],
  })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })

  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text())
  })

  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForSelector('canvas', { timeout: 15000 })
  await page.waitForTimeout(SETTLE_MS)

  // 1) Vista inicial del mundo
  await page.screenshot({ path: `${OUT}/01-mundo.png` })

  // 2) Mover el avatar hacia adelante un momento (muestra cámara + caminar)
  await page.focus('canvas').catch(() => {})
  await page.keyboard.down('ArrowUp')
  await page.waitForTimeout(1400)
  await page.keyboard.up('ArrowUp')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/02-camina.png` })

  // 3) Abrir un panel de estación vía el store de zustand expuesto, o por menú.
  const opened = await page.evaluate(() => {
    // Si la app expone el store en window, lo usamos; si no, intentamos el botón.
    if (window.__store?.getState) {
      window.__store.getState().open('proyectos')
      return 'store'
    }
    return null
  })
  if (!opened) {
    // Fallback: clic en el botón "Secciones" y la primera opción del menú.
    const btn = page.getByRole('button', { name: /secciones/i })
    if (await btn.count()) {
      await btn.first().click().catch(() => {})
      await page.waitForTimeout(400)
      const item = page.getByRole('button', { name: /proyectos/i })
      if (await item.count()) await item.first().click().catch(() => {})
    }
  }
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/03-panel.png` })

  await browser.close()

  if (errors.length) {
    console.log('CONSOLE_ERRORS:\n' + errors.slice(0, 20).join('\n'))
  }
  console.log(`OK screenshots en ${OUT}`)
}

main().catch((e) => {
  console.error('CAPTURE_FAILED:', e?.message || e)
  process.exit(1)
})
