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
