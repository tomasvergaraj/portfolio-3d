import React from 'react'

// Cada estación combina su metadato para el mundo 3D (posición en el anillo,
// color del faro, tipo de monumento, variante de animación de entrada) con el
// contenido real de la página. El contenido es JSX y reutiliza las clases de
// styles.css, idénticas a la versión anterior.

export const RING_RADIUS = 14

export const STATIONS = [
  {
    id: 'sobre',
    name: 'Sobre mí',
    code: 'sobre-mi',
    icon: '◆',
    variant: 'fade',
    kind: 'house',
    angle: 0,
    color: '#e0a86b',
    Content: () => (
      <>
        <p className="ov-eyebrow">Sobre mí</p>
        <h1 className="ov-title">Construyo productos web completos, de la idea a producción.</h1>
        <p className="ov-lead">
          Hola, soy <strong>Tomás Vergara</strong>. Desarrollador full-stack desde Quillota, Región
          de Valparaíso. Fundé <strong>Nexo Software</strong> para llevar software a medida a pymes
          de la zona, y de día trabajo en tecnología dentro del sistema de salud público.
        </p>
        <p className="ov-lead">
          Me gustan los sistemas que funcionan de verdad y las interfaces que se sienten bien.
          Diseño, programo el frontend y el backend, levanto la infraestructura y dejo todo andando.
          Si algo no existe todavía, lo construyo.
        </p>
        <div className="fact-row">
          <div className="fact">
            <div className="k">Ubicación</div>
            <div className="v">Quillota, Chile</div>
          </div>
          <div className="fact">
            <div className="k">Rol</div>
            <div className="v">Full-stack</div>
          </div>
          <div className="fact">
            <div className="k">Foco</div>
            <div className="v">Web · SaaS · IA aplicada</div>
          </div>
          <div className="fact">
            <div className="k">Disponible</div>
            <div className="v">Remoto</div>
          </div>
        </div>
      </>
    ),
  },

  {
    id: 'proyectos',
    name: 'Proyectos',
    code: 'proyectos',
    icon: '▣',
    variant: 'right',
    kind: 'totems',
    angle: 72,
    color: '#2f6bff',
    Content: () => (
      <>
        <p className="ov-eyebrow">Proyectos</p>
        <h1 className="ov-title">Cosas que diseñé, programé y puse en línea.</h1>
        <p className="ov-lead" style={{ marginBottom: 26 }}>
          Una selección. Productos reales, en uso, construidos de punta a punta.
        </p>
        <div className="proj-grid">
          <div className="proj">
            <div className="pj-top">
              <div className="pj-badge" style={{ background: '#22b07d' }}>
                NF
              </div>
              <span className="pj-tag">SaaS</span>
            </div>
            <h4>NexoFitness</h4>
            <p>
              Plataforma de gestión para gimnasios: pagos con Webpay, control de acceso por QR,
              módulo de caja/POS y reportes para el dueño.
            </p>
            <div className="pj-stack">
              <span>Next.js</span>
              <span>FastAPI</span>
              <span>PostgreSQL</span>
              <span>Transbank</span>
            </div>
            <span className="pj-link">Ver proyecto →</span>
          </div>

          <div className="proj">
            <div className="pj-top">
              <div className="pj-badge" style={{ background: '#1f1f24' }}>
                NV
              </div>
              <span className="pj-tag">SaaS · IA</span>
            </div>
            <h4>Navaxa</h4>
            <p>
              SaaS para barberías con agenda y recomendaciones de corte generadas por IA. Monorepo
              completo desplegado en VPS.
            </p>
            <div className="pj-stack">
              <span>Turborepo</span>
              <span>Prisma</span>
              <span>Auth.js</span>
              <span>Anthropic API</span>
            </div>
            <span className="pj-link">Ver proyecto →</span>
          </div>

          <div className="proj">
            <div className="pj-top">
              <div className="pj-badge" style={{ background: '#e8732a' }}>
                HB
              </div>
              <span className="pj-tag">Webapp</span>
            </div>
            <h4>Hambuscador</h4>
            <p>
              Buscador de hamburgueserías de Chile: más de 1.481 locales con mapa, filtros y reseñas
              de la comunidad.
            </p>
            <div className="pj-stack">
              <span>Next.js</span>
              <span>Drizzle</span>
              <span>PostGIS</span>
              <span>Leaflet</span>
            </div>
            <span className="pj-link">Ver proyecto →</span>
          </div>

          <div className="proj">
            <div className="pj-top">
              <div className="pj-badge" style={{ background: '#2563eb' }}>
                JR
              </div>
              <span className="pj-tag">Salud pública</span>
            </div>
            <h4>Jornada &amp; FlamenGO!</h4>
            <p>
              Herramientas para hospitales: gestión de horas extra con OCR sobre PDF escaneados y
              optimización de rutas de hospitalización domiciliaria.
            </p>
            <div className="pj-stack">
              <span>FastAPI</span>
              <span>OR-Tools</span>
              <span>Tesseract</span>
              <span>Docker</span>
            </div>
            <span className="pj-link">Ver proyecto →</span>
          </div>
        </div>
      </>
    ),
  },

  {
    id: 'stack',
    name: 'Stack',
    code: 'stack',
    icon: '⬡',
    variant: 'zoom',
    kind: 'shards',
    angle: 288,
    color: '#6e9a52',
    Content: () => (
      <>
        <p className="ov-eyebrow">Stack</p>
        <h1 className="ov-title">Las herramientas con las que trabajo a diario.</h1>
        <p className="ov-lead" style={{ marginBottom: 28 }}>
          De confianza, no por moda. Elijo según el problema y mantengo todo simple de operar.
        </p>
        <div className="stack-grid">
          <div className="stack-col">
            <h4>Frontend</h4>
            <div className="chips">
              <span className="chip lead">React</span>
              <span className="chip lead">Next.js</span>
              <span className="chip">Astro</span>
              <span className="chip">TypeScript</span>
              <span className="chip">Tailwind</span>
            </div>
          </div>
          <div className="stack-col">
            <h4>Backend</h4>
            <div className="chips">
              <span className="chip lead">FastAPI</span>
              <span className="chip">Node.js</span>
              <span className="chip">Python</span>
              <span className="chip">PHP</span>
            </div>
          </div>
          <div className="stack-col">
            <h4>Datos</h4>
            <div className="chips">
              <span className="chip lead">PostgreSQL</span>
              <span className="chip">Prisma</span>
              <span className="chip">Drizzle</span>
            </div>
          </div>
          <div className="stack-col">
            <h4>Infraestructura</h4>
            <div className="chips">
              <span className="chip">Docker</span>
              <span className="chip">VPS Linux</span>
              <span className="chip">Cloudflare</span>
              <span className="chip">Nginx · Caddy</span>
            </div>
          </div>
          <div className="stack-col" style={{ gridColumn: '1 / -1' }}>
            <h4>Integraciones</h4>
            <div className="chips">
              <span className="chip">Transbank · Webpay</span>
              <span className="chip">OR-Tools</span>
              <span className="chip">OCR · Tesseract</span>
              <span className="chip">Anthropic API</span>
            </div>
          </div>
        </div>
      </>
    ),
  },

  {
    id: 'experiencia',
    name: 'Experiencia',
    code: 'experiencia',
    icon: '▲',
    variant: 'left',
    kind: 'tower',
    angle: 144,
    color: '#4a7fb5',
    Content: () => (
      <>
        <p className="ov-eyebrow">Experiencia</p>
        <h1 className="ov-title">Dónde he estado construyendo.</h1>
        <div className="timeline" style={{ marginTop: 24 }}>
          <div className="exp">
            <div className="when">Actualidad</div>
            <div>
              <h4>Fundador &amp; Desarrollador</h4>
              <div className="org">Nexo Software SpA</div>
              <p>
                Software a medida para pymes de la Región de Valparaíso. Diseño, desarrollo y
                operación de landing pages y plataformas SaaS propias.
              </p>
            </div>
          </div>
          <div className="exp">
            <div className="when">Actualidad</div>
            <div>
              <h4>Técnico TIC</h4>
              <div className="org">Hospital Biprovincial Quillota–Petorca</div>
              <p>
                Soporte y desarrollo de sistemas internos: gestión de horas extra, herramientas
                clínicas y proyectos de integración con sistemas legados.
              </p>
            </div>
          </div>
          <div className="exp">
            <div className="when">2023 – 2025</div>
            <div>
              <h4>Ingeniería en Informática</h4>
              <div className="org">IACC</div>
              <p>Formación en desarrollo de software, bases de datos y arquitectura de sistemas.</p>
            </div>
          </div>
          <div className="exp">
            <div className="when">Antes</div>
            <div>
              <h4>Técnico Superior en Informática</h4>
              <div className="org">CFT PUCV</div>
              <p>Base técnica en programación, redes y soporte.</p>
            </div>
          </div>
        </div>
      </>
    ),
  },

  {
    id: 'contacto',
    name: 'Contacto',
    code: 'contacto',
    icon: '✦',
    variant: 'up',
    kind: 'lighthouse',
    angle: 216,
    color: '#e85d5d',
    Content: () => (
      <>
        <p className="ov-eyebrow">Contacto</p>
        <h1 className="ov-title">¿Construimos algo? Hablemos.</h1>
        <p className="ov-lead" style={{ marginBottom: 28 }}>
          Respondo rápido. Cuéntame qué necesitas y vemos cómo lo armamos.
        </p>
        <div className="contact-grid">
          <a className="cta-card" href="mailto:contacto@nexosoftware.cl">
            <span className="ci">✉</span>
            <span>
              <span className="ck">Correo</span>
              <span className="cv">contacto@nexosoftware.cl</span>
            </span>
          </a>
          <a className="cta-card" href="https://github.com/tomasvergaraj" target="_blank" rel="noopener noreferrer">
            <span className="ci">⌥</span>
            <span>
              <span className="ck">GitHub</span>
              <span className="cv">@tomasvergaraj</span>
            </span>
          </a>
          <a className="cta-card" href="https://linkedin.com/in/tomasvergaraj" target="_blank" rel="noopener noreferrer">
            <span className="ci">in</span>
            <span>
              <span className="ck">LinkedIn</span>
              <span className="cv">in/tomasvergaraj</span>
            </span>
          </a>
          <a className="cta-card" href="https://portfolio-tvj.vercel.app" target="_blank" rel="noopener noreferrer">
            <span className="ci">◐</span>
            <span>
              <span className="ck">Portafolio</span>
              <span className="cv">portfolio-tvj.vercel.app</span>
            </span>
          </a>
        </div>
        <div className="contact-line">
          <a className="btn-primary" href="https://wa.me/56981964119" target="_blank" rel="noopener noreferrer">
            Escribir por WhatsApp →
          </a>
          <span className="contact-note">Primera conversación sin costo · respondo hoy.</span>
        </div>
      </>
    ),
  },
]

// Posición [x, 0, z] de una estación a partir de su ángulo.
export function stationPosition(angleDeg, radius = RING_RADIUS) {
  const a = (angleDeg * Math.PI) / 180
  return [Math.sin(a) * radius, 0, Math.cos(a) * radius]
}
