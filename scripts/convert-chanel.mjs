// PUNTUAL: convierte el FBX de Chanel (gata Meshy/Unreal) a GLB crudo usando el
// conversor del navegador (convert.html). Borrar tras usar.
//   node scripts/convert-chanel.mjs [http://localhost:5173]
import { chromium } from 'playwright'
import { writeFile, mkdir } from 'node:fs/promises'

const BASE = process.argv[2] || 'https://10.68.121.15:5174'
const PAGE = `${BASE}/convert.html`
const SRC = '/chanel_src.fbx'
const OUT = 'tmp/chanel.raw.glb'

async function main() {
  await mkdir('tmp', { recursive: true })
  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  })
  const ctx = await browser.newContext({ ignoreHTTPSErrors: true })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })

  await page.goto(PAGE, { waitUntil: 'networkidle', timeout: 30000 })
  await page.waitForFunction(() => window.__convertReady === true, { timeout: 20000 })

  const diag = await page.evaluate((src) => window.diagFBX(src), SRC)
  console.log('DIAG texturas:', JSON.stringify(diag, null, 2))

  const b64 = await page.evaluate((src) => window.convertFBX(src, { stripMesh: false }), SRC)
  const buf = Buffer.from(b64, 'base64')
  await writeFile(OUT, buf)
  console.log(`${SRC} -> ${OUT}  (${(buf.length / 1048576).toFixed(2)} MB)`)

  await browser.close()
  if (errors.length) console.log('CONSOLE_ERRORS:\n' + errors.slice(0, 20).join('\n'))
  console.log('OK')
}
main().catch((e) => { console.error('FAILED:', e?.message || e); process.exit(1) })
