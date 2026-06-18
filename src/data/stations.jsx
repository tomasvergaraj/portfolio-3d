import React from 'react'

// Cada estación combina su metadato para el mundo 3D (posición en el anillo,
// color del faro, tipo de monumento, variante de animación de entrada) con el
// contenido real de la página. El contenido es JSX y reutiliza las clases de
// styles.css. La información se mantiene alineada con el portafolio 2D.

export const RING_RADIUS = 14

// Insignia de proyecto: muestra el logo oficial del producto (si lo hay) y, si
// no, un icono genérico de "proyecto de código".
function ProjBadge({ src, color }) {
  const [failed, setFailed] = React.useState(false)
  if (src && !failed) {
    return (
      <div className="pj-badge" style={{ background: '#fff', padding: 5 }}>
        <img
          src={src}
          alt=""
          width="100%"
          height="100%"
          style={{ objectFit: 'contain', display: 'block' }}
          onError={() => setFailed(true)}
        />
      </div>
    )
  }
  return (
    <div className="pj-badge" style={{ background: color || '#7c8696' }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M9 10l-2 2 2 2" />
        <path d="M15 10l2 2-2 2" />
      </svg>
    </div>
  )
}

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
        <h1 className="ov-title">Construyo software con foco en usuarios reales.</h1>
        <p className="ov-lead">
          Hola, soy <strong>Tomás Vergara</strong>, desarrollador full-stack desde Quillota, Región
          de Valparaíso. Fundé <strong>Nexo Software SpA</strong> para llevar software a medida y
          productos SaaS a empresas, y trabajo como Full Stack Developer en el Hospital
          Biprovincial Quillota–Petorca.
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
            <div className="v">Web · SaaS · a medida</div>
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
              <ProjBadge src="/logo-nexofitness.png" />
              <span className="pj-tag">SaaS</span>
            </div>
            <h4>Nexo Fitness</h4>
            <p>
              SaaS para la gestión integral de gimnasios: socios, planes, pagos y vencimientos.
              Multi-tenant y containerizado con Docker. En producción.
            </p>
            <div className="pj-stack">
              <span>TypeScript</span>
              <span>React</span>
              <span>Node.js</span>
              <span>Docker</span>
            </div>
            <a className="pj-link" href="https://nexofitness.cl/" target="_blank" rel="noopener noreferrer">Ver proyecto →</a>
          </div>

          <div className="proj">
            <div className="pj-top">
              <ProjBadge src="/logo-hambuscador.png" />
              <span className="pj-tag">Full Stack</span>
            </div>
            <h4>Hambuscador</h4>
            <p>
              Plataforma y PWA para descubrir hamburgueserías en todo Chile: 1.481 locales, búsqueda
              geográfica (PostGIS), mapa propio y reseñas de la comunidad.
            </p>
            <div className="pj-stack">
              <span>Next.js 15</span>
              <span>PostGIS</span>
              <span>Drizzle</span>
              <span>MapLibre</span>
            </div>
            <a className="pj-link" href="https://hambuscador.cl" target="_blank" rel="noopener noreferrer">Ver proyecto →</a>
          </div>

          <div className="proj">
            <div className="pj-top">
              <ProjBadge src="/logo-nexocotiza.png" />
              <span className="pj-tag">PWA</span>
            </div>
            <h4>NexoCotiza</h4>
            <p>
              Crea cotizaciones profesionales y descárgalas en PDF o Word, 100% en el navegador, sin
              registro. Cálculo de IVA y validación de RUT chileno.
            </p>
            <div className="pj-stack">
              <span>Astro</span>
              <span>React</span>
              <span>IndexedDB</span>
              <span>PWA</span>
            </div>
            <a className="pj-link" href="https://cotiza.nexosoftware.cl" target="_blank" rel="noopener noreferrer">Ver proyecto →</a>
          </div>

          <div className="proj">
            <div className="pj-top">
              <ProjBadge src="/logo-nexotranscriptor.png" />
              <span className="pj-tag">Full Stack · IA</span>
            </div>
            <h4>Nexo Transcriptor</h4>
            <p>
              Transcribe audio a texto con Whisper y lo exporta a Word. Cola Redis + Celery con
              progreso en tiempo real; autohospedable con Docker.
            </p>
            <div className="pj-stack">
              <span>FastAPI</span>
              <span>faster-whisper</span>
              <span>Redis</span>
              <span>Docker</span>
            </div>
            <a className="pj-link" href="https://transcribe.nexosoftware.cl" target="_blank" rel="noopener noreferrer">Ver proyecto →</a>
          </div>

          <div className="proj">
            <div className="pj-top">
              <ProjBadge color="#3b6ef0" />
              <span className="pj-tag">Full Stack</span>
            </div>
            <h4>Sistema de Sumariales</h4>
            <p>
              Registro, control y seguimiento de procesos sumariales: cálculo automático de plazos
              legales, roles, notificaciones en tiempo real y trazabilidad.
            </p>
            <div className="pj-stack">
              <span>React</span>
              <span>Firebase</span>
              <span>Zustand</span>
              <span>Zod</span>
            </div>
            <a className="pj-link" href="https://sistema-sumariales-demo.vercel.app/" target="_blank" rel="noopener noreferrer">Ver demo →</a>
          </div>

          <div className="proj">
            <div className="pj-top">
              <ProjBadge src="/logo-nexopos.png" />
              <span className="pj-tag">Escritorio</span>
            </div>
            <h4>Minimarket POS</h4>
            <p>
              Punto de venta de escritorio para minimarket: ventas, inventario y boletas, con
              operación offline. Multiplataforma con Electron.
            </p>
            <div className="pj-stack">
              <span>Electron</span>
              <span>React</span>
              <span>TypeScript</span>
            </div>
            <a className="pj-link" href="https://github.com/tomasvergaraj/minimarket-pos" target="_blank" rel="noopener noreferrer">Ver repo →</a>
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
              <span className="chip lead">Node.js</span>
              <span className="chip lead">FastAPI</span>
              <span className="chip">Python</span>
              <span className="chip">Express</span>
            </div>
          </div>
          <div className="stack-col">
            <h4>Datos</h4>
            <div className="chips">
              <span className="chip lead">PostgreSQL</span>
              <span className="chip">Prisma</span>
              <span className="chip">Drizzle</span>
              <span className="chip">PostGIS</span>
              <span className="chip">Firebase</span>
              <span className="chip">Redis</span>
            </div>
          </div>
          <div className="stack-col">
            <h4>Infraestructura</h4>
            <div className="chips">
              <span className="chip">Docker</span>
              <span className="chip">Vercel</span>
              <span className="chip">VPS Linux</span>
              <span className="chip">Cloudflare</span>
              <span className="chip">Nginx · Caddy</span>
            </div>
          </div>
          <div className="stack-col" style={{ gridColumn: '1 / -1' }}>
            <h4>Integraciones</h4>
            <div className="chips">
              <span className="chip">Whisper · OCR</span>
              <span className="chip">OpenAI API</span>
              <span className="chip">Transbank · Webpay</span>
              <span className="chip">WhatsApp</span>
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
            <div className="when">2026 — Presente</div>
            <div>
              <h4>Fundador &amp; Desarrollador Full-stack</h4>
              <div className="org">Nexo Software SpA</div>
              <p>
                Empresa de software a medida y productos SaaS propios. Diseño, desarrollo y operación
                de plataformas; lancé Nexo Fitness como primer producto.
              </p>
            </div>
          </div>
          <div className="exp">
            <div className="when">2025 — Presente</div>
            <div>
              <h4>Full Stack Developer</h4>
              <div className="org">Hospital Biprovincial Quillota–Petorca</div>
              <p>
                Desarrollo de aplicaciones web escalables con React y Node.js, y sistemas internos de
                apoyo a la gestión clínica.
              </p>
            </div>
          </div>
          <div className="exp">
            <div className="when">2023 — 2025</div>
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
        <h1 className="ov-title">Conversemos sobre tu proyecto.</h1>
        <p className="ov-lead" style={{ marginBottom: 28 }}>
          ¿Tienes una idea o necesitas software a medida? Respondo rápido. Cuéntame qué necesitas y
          vemos cómo lo armamos.
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
          <a className="cta-card" href="https://www.linkedin.com/in/tomasvergaraj/" target="_blank" rel="noopener noreferrer">
            <span className="ci">in</span>
            <span>
              <span className="ck">LinkedIn</span>
              <span className="cv">in/tomasvergaraj</span>
            </span>
          </a>
          <a className="cta-card" href="https://www.instagram.com/tomasvergar4/" target="_blank" rel="noopener noreferrer">
            <span className="ci">◐</span>
            <span>
              <span className="ck">Instagram</span>
              <span className="cv">@tomasvergar4</span>
            </span>
          </a>
          <a className="cta-card" href="https://portfolio-tvj.vercel.app/" target="_blank" rel="noopener noreferrer">
            <span className="ci">◆</span>
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
