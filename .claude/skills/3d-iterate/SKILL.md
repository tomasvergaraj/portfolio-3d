---
name: 3d-iterate
description: Ejecuta UNA iteración de mejora visual del mundo 3D (React Three Fiber) de principio a fin — captura el estado actual, elige el cambio de mayor impacto pendiente, lo implementa, vuelve a capturar para verificar que mejoró y no rompió nada, y hace commit. Diseñada para correr en bucle con /loop. Úsala cuando el usuario pida "mejorar la app", "iterar el diseño 3D" o cuando un loop de mejora la invoque.
---

# Iteración de mejora 3D

Una iteración = un cambio enfocado, verificado visualmente y commiteado. Trabaja
en pasos pequeños y de alto impacto; no reescribas la escena entera.

## Procedimiento (una pasada completa)

1. **Contexto.** Si existe `ITERATIONS.md` en la raíz, léelo para ver qué se hizo
   antes y qué quedó pendiente. Si no existe, créalo con un encabezado.

2. **Ver el estado actual.** Usa la skill **3d-capture** hacia
   `./screenshots/iterNN-antes` y lee los PNG. Si el dev server no corre, levántalo
   en segundo plano (`npm run dev`).

3. **Elegir el cambio.** Aplica la rúbrica de **3d-design-review** y elige el ÚNICO
   hallazgo de mayor impacto aún no resuelto. Prioriza lo que más mejora la primera
   impresión: iluminación/atmósfera, color del cielo, profundidad, sombras de
   contacto, lectura de los monumentos, suavidad de cámara/animación. Anúncialo en
   una frase antes de tocar código.

4. **Implementar.** Edición mínima en los archivos correctos (ver mapa en
   `3d-design-review`). Respeta las reglas de oro:
   - Debe verse bien **sin** el HDRI (no dependas del CDN).
   - Sin dependencias nuevas salvo justificación fuerte.
   - Mantén 60 fps; cuida el costo de cada efecto.
   - Respeta `prefers-reduced-motion` (prop `reducedMotion` ya disponible).

5. **Verificar.** Captura de nuevo hacia `./screenshots/iterNN-despues` y lee los
   PNG. Confirma que: (a) el cambio se ve y mejora lo previsto, (b) no hay canvas
   en negro ni `pageerror` reales, (c) no se rompió la UI ni el panel. Si empeoró o
   rompió algo, revierte ese cambio (`git checkout -- <archivo>`) e intenta otro.

6. **Registrar y commitear.**
   - Añade una entrada a `ITERATIONS.md`: iteración N, qué cambió, archivo(s), antes→después en una línea.
   - Commit: `git add -A && git commit -m "iter N: <resumen del cambio>"`.

## Qué cuenta como buena iteración

Alto impacto y bajo riesgo. Ejemplos típicos para esta escena:
- Cielo con gradiente real en vez de color plano; niebla afinada a la paleta.
- Una luz cálida de relleno o rim-light para dar volumen al avatar y monumentos.
- Sombras de contacto (drei `<ContactShadows>` / `<SoftShadows>`) si el costo lo permite.
- Agua más legible: color con profundidad, leve specular, reflejo del cielo.
- Variedad/distribución de vegetación; corregir clipping con caminos.
- Lectura de etiquetas: contraste, oclusión, jerarquía con la estación cercana.
- Suavizado de cámara, easing del balanceo, transición del panel.

## Criterio de parada (para el loop)

Detén el bucle cuando los hallazgos restantes sean de bajo impacto, requieran
assets externos/dependencias nuevas, o ya se haya alcanzado el número de
iteraciones pedido. Indícalo claramente en la última entrada de `ITERATIONS.md`.
