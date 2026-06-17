---
name: 3d-capture
description: Captura screenshots del portafolio 3D (React Three Fiber) corriendo en localhost para revisión visual. Úsala siempre que necesites VER el render real del mundo 3D — antes y después de un cambio visual, para comparar, o para diagnosticar un problema gráfico. Renderiza el mundo, una vista caminando y un panel de UI abierto.
---

# Capturar el render 3D

Esta app es un mundo low-poly en React Three Fiber. No se puede juzgar un cambio
visual leyendo código: hay que **ver el render**. Este proyecto trae un script de
captura con Playwright + el Chrome del sistema (la descarga del Chromium propio
está bloqueada por el proxy SSL corporativo, por eso `channel: 'chrome'`).

## Pasos

1. **Asegúrate de que el dev server corre** en `http://localhost:5173`.
   Compruébalo; si no está arriba, levántalo en segundo plano:
   ```bash
   npm run dev   # run_in_background
   ```

2. **Captura** a un directorio nombrado por iteración:
   ```bash
   node scripts/capture.mjs http://localhost:5173 ./screenshots/<etiqueta>
   ```
   Genera tres PNG en ese directorio:
   - `01-mundo.png` — vista inicial del mundo (composición, isla, iluminación, color)
   - `02-camina.png` — tras mover el avatar (cámara que persigue, balanceo al caminar)
   - `03-panel.png` — un panel de estación abierto (capa de UI sobre el 3D)

3. **Lee los tres PNG** con la herramienta Read (acepta imágenes) y analízalos.

## Notas

- El primer render tarda unos segundos (fuentes + intento de HDRI). El script ya
  espera `SETTLE_MS`; si una iteración añade carga, súbelo en `scripts/capture.mjs`.
- Si ves `CONSOLE_ERRORS` con un 404, normalmente es el HDRI/fuente del CDN
  bloqueado por el proxy — **no es fatal**, la escena se ilumina con sus luces
  analíticas. Solo preocúpate por errores de JS reales (pageerror) o canvas en negro.
- En dev el store de zustand se expone como `window.__store`, así el script abre
  paneles de forma determinista (`window.__store.getState().open('proyectos')`).
- Para comparar antes/después, captura a `./screenshots/<iter>-antes` y
  `./screenshots/<iter>-despues` y lee ambos.
