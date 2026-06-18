// Conduce el conversor del navegador (convert.html / src/convert-fbx.js) con
// Playwright + Chrome del sistema y guarda los GLB crudos en tmp/. Luego se
// comprimen con scripts/optimize-avatar.mjs.
//
// Requiere el dev server arriba en la URL base (por defecto :5173) y que los FBX
// de origen estén en public/ (no se versionan; cópialos desde character/ antes
// de correr). Luego comprime con scripts/optimize-avatar.mjs y los FBX de public/
// se pueden borrar de nuevo.
//
// Uso: node scripts/fbx-to-glb.mjs [http://localhost:5173]
import { chromium } from 'playwright'
import { writeFile, mkdir } from 'node:fs/promises'

const BASE = process.argv[2] || 'http://localhost:5173'
const PAGE = `${BASE}/convert.html`

const JOBS = [
  { src: '/character_inactive.fbx', out: 'tmp/avatar.raw.glb', stripMesh: false },
  { src: '/character_walk_in_place.fbx', out: 'tmp/avatar_walk.raw.glb', stripMesh: true },
  { src: '/character_running.fbx', out: 'tmp/avatar_run.raw.glb', stripMesh: true },
]

async function main() {
  await mkdir('tmp', { recursive: true })

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })
  const page = await browser.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto(PAGE, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForFunction(() => window.__convertReady === true, { timeout: 20000 })

  for (const job of JOBS) {
    const b64 = await page.evaluate(
      ({ src, stripMesh }) => window.convertFBX(src, { stripMesh }),
      { src: job.src, stripMesh: job.stripMesh },
    )
    const buf = Buffer.from(b64, 'base64')
    await writeFile(job.out, buf)
    console.log(`${job.src} -> ${job.out}  (${(buf.length / 1048576).toFixed(2)} MB)${job.stripMesh ? ' [solo anim]' : ''}`)
  }

  await browser.close()
  if (errors.length) console.log('CONSOLE_ERRORS:\n' + errors.slice(0, 20).join('\n'))
  console.log('OK conversión')
}

main().catch((e) => { console.error('FBX2GLB_FAILED:', e?.message || e); process.exit(1) })
