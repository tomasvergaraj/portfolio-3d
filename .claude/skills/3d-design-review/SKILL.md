---
name: 3d-design-review
description: Audita la calidad visual y de diseño del mundo 3D (React Three Fiber low-poly) contra una rúbrica de composición, iluminación, color, materiales, postprocesado, animación, UX y rendimiento. Úsala cuando el usuario pida revisar/evaluar/criticar cómo se ve la escena 3D, o como primer paso de una iteración de mejora para decidir qué arreglar. Devuelve hallazgos priorizados, no aplica cambios.
---

# Revisión de diseño 3D

Audita el render real (no solo el código) y produce una lista de hallazgos
priorizados por impacto visual. **No edites código en esta skill** — solo
diagnostica. Para aplicar arreglos usa `3d-iterate`.

## Procedimiento

1. Captura el render con la skill **3d-capture** y lee los tres PNG.
2. Recorre la rúbrica de abajo mirando las imágenes y el código relevante.
3. Devuelve los hallazgos como una tabla priorizada:
   `severidad (alta/media/baja) · qué se ve mal · archivo:línea · arreglo propuesto`.

## Mapa de archivos (dónde vive cada cosa)

| Aspecto | Archivo |
| --- | --- |
| Luces, niebla, cielo, preset de Environment | `src/world/Scene.jsx` |
| Forma de la isla, caminos, plaza, materiales del suelo | `src/world/Island.jsx` |
| Agua / oleaje | `src/world/Water.jsx` |
| Árboles, rocas, nubes, distribución (PRNG) | `src/world/Scenery.jsx` |
| Avatar, perro, cámara, velocidad, balanceo | `src/world/Player.jsx` |
| Monumentos por estación, faros, etiquetas | `src/world/StationMarker.jsx` |
| Bloom + Vignette | `src/world/Effects.jsx` |
| Tokens de color/tipografía, tarjetas, paneles | `src/styles.css` |
| Contenido y metadatos de las 5 estaciones | `src/data/stations.jsx` |
| Capas de UI (HUD, joystick, menú, panel, loader) | `src/ui/*.jsx` |

## Rúbrica

**Composición y escala**
- ¿Hay un punto focal claro? ¿La cámara encuadra bien la isla y al avatar?
- ¿Las proporciones entre avatar, monumentos, árboles y la isla se sienten coherentes?
- ¿Hay espacio negativo respirable, o todo se siente vacío / saturado?

**Iluminación y sombras**
- ¿Hay dirección de luz y volumen, o todo se ve plano? (clave: el HDRI puede no
  cargar tras el proxy — la escena debe verse bien solo con las luces analíticas).
- ¿Las sombras aterrizan los objetos en el suelo? ¿Son demasiado duras/suaves?
- ¿Falta luz de relleno/rebote o un toque de oclusión de contacto?

**Color y atmósfera**
- ¿La paleta es armónica? ¿El cielo, la niebla y el suelo conversan entre sí?
- ¿Falta gradiente de cielo (se ve un color plano) o profundidad atmosférica?
- ¿Los faros de las estaciones destacan sin chillar?

**Materiales**
- Low-poly: `flatShading` consistente, `roughness`/`metalness` creíbles.
- ¿El agua se lee como agua (reflejo, transparencia, color con profundidad)?

**Animación y vida**
- ¿La escena respira (nubes, oleaje, faros pulsando) sin marear?
- Avatar: ¿el caminar/giro se siente natural? ¿La cámara persigue con suavidad?
- Respeta `prefers-reduced-motion` (la prop `reducedMotion` ya se propaga).

**UX e interacción**
- ¿Se entiende dónde ir y qué es interactivo? ¿Las etiquetas se leen y no tapan?
- Hover/cercanía: ¿hay feedback claro? ¿El panel abre/cierra con buena animación?
- Móvil: joystick y botón Entrar usables; nada queda fuera de pantalla.

**Rendimiento**
- ¿`dpr`, sombras, segmentos de geometría y postprocesado son razonables?
- El oleaje recalcula normales por frame sobre 64×64 vértices: ¿justificado?
- Evitar re-render del Canvas por estado (zustand ya aísla esto: mantenerlo así).

## Reglas de oro de este proyecto

- **Debe verse bien sin el HDRI** (el CDN puede estar bloqueado). No dependas de
  `Environment` para la legibilidad básica de la escena.
- Cambios pequeños y de alto impacto antes que reescrituras.
- No metas dependencias nuevas sin justificarlo; el stack actual es deliberadamente
  acotado (fiber, drei, postprocessing, motion, zustand, three).
- Mantén 60 fps como objetivo; mide el costo de cada efecto nuevo.
