import React from 'react'
import emailjs from '@emailjs/browser'
import { BrandIcon } from '../ui/BrandIcon'

// Claves de EmailJS — las mismas del portafolio 2D (mismo servicio/plantilla, así
// los correos llegan con el formato ya conocido). La public key de EmailJS está
// pensada para vivir en el cliente; igualmente se puede sobreescribir por entorno
// (VITE_EMAILJS_*) sin tocar el código. Los defaults garantizan que el deploy
// funcione sin configurar variables en Vercel.
const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_uovgy7p'
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_yverecl'
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '3XKJiU8u1UJFijKn8'

// Datos de contacto reutilizados (alineados con el portafolio 2D, misma marca).
export const CONTACT = {
  email: 'contacto@nexosoftware.cl',
  phoneDisplay: '+56 9 8196 4119',
  phoneHref: 'tel:+56981964119',
  location: 'Quillota, Chile',
  whatsapp: 'https://wa.me/56981964119',
  github: 'https://github.com/tomasvergaraj',
  linkedin: 'https://www.linkedin.com/in/tomasvergaraj/',
  instagram: 'https://www.instagram.com/tomasvergar4/',
  cv: '/CV_Tomas_Vergara_FullStack.pdf',
}

// Formulario de contacto controlado. Envía el correo automáticamente vía EmailJS
// (sin abrir el cliente de correo del usuario) usando el mismo servicio/plantilla
// que el portafolio 2D. Réplica del Contact.tsx del 2D.
function ContactForm() {
  const [form, setForm] = React.useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = React.useState('idle') // idle | sending | success | error
  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const onSubmit = async (e) => {
    e.preventDefault()
    setStatus('sending')
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          from_name: form.name,
          from_email: form.email,
          subject: form.subject,
          message: form.message,
          reply_to: form.email,
        },
        EMAILJS_PUBLIC_KEY
      )
      setStatus('success')
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (err) {
      console.error('Error al enviar el correo:', err)
      setStatus('error')
    } finally {
      setTimeout(() => setStatus('idle'), 6000)
    }
  }

  const sending = status === 'sending'

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <div className="form-row">
        <div className="form-group">
          <label className="form-label" htmlFor="cf-name">Nombre</label>
          <input id="cf-name" name="name" className="form-field" value={form.name} onChange={onChange} required placeholder="Tu nombre" autoComplete="name" />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="cf-email">Email</label>
          <input id="cf-email" name="email" type="email" className="form-field" value={form.email} onChange={onChange} required placeholder="tu@email.com" autoComplete="email" />
        </div>
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="cf-subject">Asunto</label>
        <input id="cf-subject" name="subject" className="form-field" value={form.subject} onChange={onChange} required placeholder="¿De qué quieres hablar?" />
      </div>
      <div className="form-group">
        <label className="form-label" htmlFor="cf-message">Mensaje</label>
        <textarea id="cf-message" name="message" className="form-field" value={form.message} onChange={onChange} required rows={5} placeholder="Cuéntame sobre tu proyecto..." />
      </div>

      <div aria-live="polite">
        {status === 'success' && (
          <p className="form-status success">Mensaje enviado. Te responderé pronto.</p>
        )}
        {status === 'error' && (
          <p className="form-status error">Hubo un error. Intenta nuevamente o escríbeme directo a {CONTACT.email}.</p>
        )}
      </div>

      <button type="submit" className="btn-submit" disabled={sending} aria-busy={sending}>
        {sending ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Enviando
          </>
        ) : (
          <>
            Enviar mensaje
            <BrandIcon id="arrow-up-right" size={16} color="#fff" />
          </>
        )}
      </button>
    </form>
  )
}

// Cada estación combina su metadato para el mundo 3D (posición en el anillo,
// color del faro, tipo de monumento, variante de animación de entrada) con el
// contenido real de la página. El contenido es JSX y reutiliza las clases de
// styles.css. La información se mantiene alineada con el portafolio 2D.

export const RING_RADIUS = 14

// Insignia de proyecto: muestra el logo oficial del producto (si lo hay) y, si
// no, un icono genérico de "proyecto de código".
function ProjBadge({ src, color, bg = '#fff' }) {
  const [failed, setFailed] = React.useState(false)
  if (src && !failed) {
    return (
      <div className="pj-badge" style={{ background: bg, padding: 5 }}>
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

        <div className="cta-section">
          <div>
            <h2 className="cta-title">¿Conversamos?</h2>
            <p className="cta-text">Descarga mi CV o escríbeme directamente.</p>
          </div>
          <a className="contact-cv-button" href={CONTACT.cv} download="CV-Tomas-Vergara.pdf">
            <BrandIcon id="download" size={16} />
            Descargar CV
          </a>
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

          <div className="proj">
            <div className="pj-top">
              <ProjBadge src="/logo-fertomart.svg" />
              <span className="pj-tag">Landing</span>
            </div>
            <h4>Fertomart</h4>
            <p>
              Landing premium para una banquetería con 25 años en la V Región: galería con lightbox
              swipeable, reels de video y SEO local agresivo.
            </p>
            <div className="pj-stack">
              <span>Astro</span>
              <span>TypeScript</span>
              <span>SEO</span>
              <span>WhatsApp</span>
            </div>
            <a className="pj-link" href="https://fertomart.cl/" target="_blank" rel="noopener noreferrer">Ver proyecto →</a>
          </div>

          <div className="proj">
            <div className="pj-top">
              <ProjBadge src="/logo-bugueno.png" bg="#16202e" />
              <span className="pj-tag">Landing</span>
            </div>
            <h4>Bugueño Hormigones</h4>
            <p>
              Landing corporativa para una planta certificada de hormigón en Hijuelas, enfocada en
              captar cotizaciones por WhatsApp en toda la Quinta Región.
            </p>
            <div className="pj-stack">
              <span>React</span>
              <span>Vite</span>
              <span>SEO local</span>
              <span>WhatsApp</span>
            </div>
            <a className="pj-link" href="https://buguenohormigones.cl/" target="_blank" rel="noopener noreferrer">Ver proyecto →</a>
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
              <span className="chip lead">Docker</span>
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
        <p className="ov-lead" style={{ marginBottom: 32 }}>
          ¿Tienes una idea o necesitas software a medida? Escríbeme directamente o cotiza con{' '}
          <a
            className="lead-link"
            href="https://nexosoftware.cl/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Nexo Software
          </a>
          .
        </p>

        <div className="contact-wrapper">
          {/* Izquierda: datos directos + redes + CV */}
          <div className="contact-left">
            <div className="contact-section">
              <p className="contact-section-label">Datos directos</p>
              <ul className="contact-info-list">
                <li className="contact-info-item">
                  <span className="contact-info-icon"><BrandIcon id="mail" size={18} /></span>
                  <span>
                    <span className="contact-info-label">Correo</span>
                    <a className="contact-info-value" href={`mailto:${CONTACT.email}`}>{CONTACT.email}</a>
                  </span>
                </li>
                <li className="contact-info-item">
                  <span className="contact-info-icon"><BrandIcon id="phone" size={18} /></span>
                  <span>
                    <span className="contact-info-label">Teléfono</span>
                    <a className="contact-info-value" href={CONTACT.phoneHref}>{CONTACT.phoneDisplay}</a>
                  </span>
                </li>
                <li className="contact-info-item">
                  <span className="contact-info-icon"><BrandIcon id="mappin" size={18} /></span>
                  <span>
                    <span className="contact-info-label">Ubicación</span>
                    <span className="contact-info-value">{CONTACT.location}</span>
                  </span>
                </li>
              </ul>
            </div>

            <div className="contact-section">
              <p className="contact-section-label">Redes</p>
              <div className="contact-socials">
                <a className="contact-social-link" href={CONTACT.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <BrandIcon id="github" size={20} />
                </a>
                <a className="contact-social-link" href={CONTACT.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <BrandIcon id="linkedin" size={20} />
                </a>
                <a className="contact-social-link" href={CONTACT.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                  <BrandIcon id="instagram" size={20} />
                </a>
                <a className="contact-social-link" href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                  <BrandIcon id="whatsapp" size={20} />
                </a>
              </div>
            </div>

            <div className="contact-section">
              <a className="contact-cv-button" href={CONTACT.cv} download="CV-Tomas-Vergara.pdf">
                <BrandIcon id="download" size={16} />
                Descargar CV
              </a>
            </div>
          </div>

          {/* Derecha: formulario */}
          <div className="contact-right">
            <ContactForm />
            <div className="contact-line">
              <a className="btn-secondary" href={CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">
                <BrandIcon id="whatsapp" size={18} />
                Escribir por WhatsApp
              </a>
              <span className="contact-note">Primera conversación sin costo · respondo hoy.</span>
            </div>
          </div>
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
