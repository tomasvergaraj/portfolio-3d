# Portafolio 3D — Tomás Vergara

Landing page interactiva construida con **React Three Fiber**. Un avatar recorre una isla low-poly y cada parada abre una sección del portafolio (Sobre mí, Proyectos, Stack, Experiencia, Contacto).

## Stack

- **Vite + React 18**
- **@react-three/fiber** — Three.js declarativo
- **@react-three/drei** — `Environment` (HDRI), `Float`, `Html`, `useProgress`
- **@react-three/postprocessing** — Bloom + Vignette
- **motion** (ex Framer Motion) — animaciones de la interfaz
- **zustand** — estado compartido entre el mundo 3D y la UI

## Cómo correrlo

```bash
npm install
npm run dev      # servidor de desarrollo (http://localhost:5173)
npm run build    # build de producción en dist/
npm run preview  # previsualiza el build
```

> La primera carga descarga las fuentes de Google Fonts y un mapa de entorno (HDRI) desde un CDN. Si no hay red, la escena igual se ilumina con luces propias y entra después de unos segundos.

## Despliegue

El proyecto genera estáticos en `dist/`. Sirve para cualquier hosting estático:

- **Cloudflare Pages**: build command `npm run build`, output `dist`.
- **Netlify**: igual.
- **GitHub Pages**: `base: './'` ya está configurado en `vite.config.js`, así que funciona también en un subdirectorio.

## Controles

- **Escritorio**: `W A S D` o flechas para moverse; `E` / `Enter` para entrar a una parada; `Escape` para volver. También se puede hacer clic en un monumento o usar el botón **Secciones**.
- **Móvil**: joystick abajo a la izquierda y botón **Entrar** abajo a la derecha.

## Cómo personalizarlo

Casi todo vive en dos lugares:

- **`src/data/stations.jsx`** — las 5 estaciones: nombre, color del faro, tipo de monumento (`kind`), variante de animación (`variant`), ángulo en el anillo y el contenido JSX de cada página. Edita textos, proyectos y enlaces aquí.
- **`src/styles.css`** — los tokens de color y tipografía (`:root`) y los estilos de las tarjetas y paneles.

Otros puntos útiles:

- **`src/world/Scene.jsx`** — luces, niebla, cielo y el preset del `Environment` (`"park"`, `"sunset"`, `"dawn"`, etc.).
- **`src/world/Player.jsx`** — velocidad, cámara, el avatar y el perro.
- **`src/world/Effects.jsx`** — intensidad del bloom y la viñeta.

### Cambiar el avatar por un modelo 3D real

El avatar está hecho con primitivas en `src/world/Player.jsx`. Para usar un modelo riggeado (por ejemplo de [Mixamo](https://www.mixamo.com), en formato `.glb`):

1. Coloca el archivo en `public/` (ej. `public/avatar.glb`).
2. Cárgalo con `useGLTF('/avatar.glb')` de drei y reemplaza el grupo del `Avatar`.
3. Para animarlo al caminar, usa `useAnimations` de drei.

## Estructura

```
src/
├── main.jsx            punto de entrada
├── App.jsx             Canvas + capas de UI
├── store.js            estado (zustand)
├── styles.css          tokens y estilos
├── data/stations.jsx   contenido de las 5 secciones
├── controls/           teclado + input compartido
├── world/              isla, agua, vegetación, player, estaciones, efectos
└── ui/                 loader, HUD, joystick, menú, panel
```
