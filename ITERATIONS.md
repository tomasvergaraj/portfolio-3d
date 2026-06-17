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
