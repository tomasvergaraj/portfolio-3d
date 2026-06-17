# Iteraciones de mejora visual (loop 3D)

Bitácora del loop de mejoras. Cada entrada: qué cambió, archivos y efecto.
Screenshots antes/después en `screenshots/iterN-*` (ignorados por git).

## Iteración 1 — Cielo con gradiente + atmósfera
- **Problema:** el fondo era un color plano (`#a9cdea`); aplanaba la primera impresión.
- **Cambio:** nuevo `src/world/Sky.jsx` (domo con ShaderMaterial, gradiente cenit→horizonte, no afectado por la niebla). Wireado en `src/world/Scene.jsx`; niebla afinada al color de horizonte (`70→165`) para fundir isla/agua en la distancia.
- **Efecto:** cielo con profundidad; horizonte coherente con la niebla. Sin dependencias nuevas.

## Iteración 2 — Iluminación con volumen y temperatura
- **Problema:** luz analítica muy uniforme (HDRI bloqueado) → escena plana, sin modelado de formas.
- **Cambio:** en `src/world/Scene.jsx`, key direccional cálida (`#fff1d4`, 1.7) + relleno frío opuesto (`#bcd7ff`, 0.45); ambiente y hemisférica bajados para conservar contraste.
- **Efecto:** pasto soleado, siluetas separadas del fondo, volumen en avatar/monumentos.

## Iteración 3 — Sombras de contacto (grounding)
- **Problema:** árboles, rocas y monumentos se sentían flotando; el avatar usaba una sombra circular falsa.
- **Cambio:** `<ContactShadows>` (drei) en `src/world/Scene.jsx` cubriendo la isla (scale 52, blur 2.6, opacity 0.42), dinámico para incluir avatar/perro. Eliminada la sombra circular falsa en `src/world/Player.jsx`.
- **Efecto:** todo asentado en el suelo con oclusión de contacto suave; más profundidad.

## Iteración 4 — Agua con profundidad
- **Problema:** el mar era un teal plano sin profundidad.
- **Cambio:** en `src/world/Water.jsx`, gradiente radial por vértice (`#5fc6c0` orilla → `#1f5f86` mar adentro) vía atributo `color` + `vertexColors`; más specular (roughness 0.22, metalness 0.25).
- **Efecto:** el mar se lee con fondo y profundidad; capta mejor el cielo. Mantiene oleaje low-poly.

## Iteración 5 — Atmósfera viva (motas)
- **Problema:** el aire estaba "vacío"; faltaba vida/ambiente premium.
- **Cambio:** `<Sparkles>` (drei) en `src/world/Scene.jsx` (42 motas cálidas, sutiles), congeladas con `reducedMotion`. Subido `SETTLE_MS` del script de captura a 6000 ms (la escena carga un poco más).
- **Efecto:** motas que flotan y captan la luz; mundo más vivo sin recargar el render.

## Iteración 6 — Asentar avatar y mascota sobre el suelo
- **Problema (reportado):** el perro se veía hundido bajo el mapa; el avatar también quedaba parcialmente enterrado (lo disimulaba la sombra de contacto).
- **Causa:** ambos grupos en `y=0`, pero la superficie de la isla está en `y≈0.7`.
- **Cambio:** en `src/world/Player.jsx`, constante `GROUND_Y=0.7`; avatar en `y=GROUND_Y-0.2` (pies sobre el suelo) y perro en `y=GROUND_Y` (patas sobre el suelo). Sombra de contacto bajada a `y=0.72` en `src/world/Scene.jsx` para captarlos.
- **Efecto:** avatar y perro se paran correctamente sobre la isla.

## Iteración 7 — Correr con Shift (sprint)
- **Pedido:** poder moverse más rápido con Shift.
- **Cambio:** `src/controls/useKeyboard.js` rastrea `shift`; `src/controls/input.js` expone `sprint` (Shift o joystick a fondo vía `touch.boost`); `src/world/Player.jsx` aplica `SPRINT_MULT=1.85` a la velocidad y acelera/marca más el balanceo al correr. HUD actualizado con la pista "Shift para correr" (`src/ui/Hud.jsx`).
- **Verificación:** medido por Playwright — desplazamiento con Shift / sin Shift = ratio 1.85 exacto.
- **Efecto:** sprint funcional en escritorio (y preparado para móvil con `touch.boost`).

## Iteración 8 — Sprint también en móvil
- **Cambio:** `src/ui/Joystick.jsx` activa `touch.boost = true` al empujar el stick a fondo (>92% del radio) y lo resetea al soltar. Completa el sprint que la iter 7 dejó preparado para táctil.
- **Efecto:** en móvil se corre empujando el joystick al máximo; al centro se camina.

## Iteración 9 — Ocultar etiquetas 2D con el modal abierto
- **Pedido:** esconder las etiquetas 2D al abrir un modal (se colaban "Sobre mí" sobre el panel).
- **Causa:** las etiquetas usan `<Html>` de drei, que se dibuja en el DOM fuera del lienzo, así que aparecían por encima del modal.
- **Cambio:** en `src/world/StationMarker.jsx`, no se renderiza la etiqueta cuando `active !== null` (`modalOpen`).
- **Efecto:** con un panel abierto, el modal queda limpio.

## Iteración 10 — La mascota mira hacia donde avanza
- **Pedido:** que la mascota no se mueva de lado.
- **Causa:** el perro mira a +x en su modelo, pero se orientaba con `atan2(ddx, ddz)` (válido para algo que mira a +z) → quedaba perpendicular al movimiento (caminaba de costado).
- **Cambio:** en `src/world/Player.jsx`, `dtar = atan2(ddx, ddz) - π/2`; además orientación inicial del perro (`rotation y = π/2`) para que no aparezca de lado en reposo.
- **Efecto:** el hocico apunta a la dirección de avance.

---
**Estado del loop:** 8 iteraciones completadas. Visual: cielo, luz, sombras de contacto, agua, atmósfera. Jugabilidad/bugs: avatar y mascota asentados sobre el suelo (ya no se hunden), sprint con Shift y con joystick a fondo. Lo que queda es de menor impacto o requeriría assets/dependencias externas (modelo riggeado para el avatar vía Mixamo+useGLTF, HDRI local para reflejos sin depender del CDN, texturas de suelo).
