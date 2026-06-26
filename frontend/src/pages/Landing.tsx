import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { motion, AnimatePresence, type Variants } from 'framer-motion'
import AuthModal from '../components/AuthModal'
import { 
  Activity, 
  Calendar, 
  Video, 
  ShieldCheck, 
  Users, 
  Laptop, 
  Star, 
  ArrowRight, 
  CheckCircle,
  Clock,
  HeartPulse
} from 'lucide-react'

// Animation variants
const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
}

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15
    }
  }
}

const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.7, ease: 'easeOut' }
  }
}

const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.7, ease: 'easeOut' }
  }
}

const cardScale: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}

export default function Landing() {
  const [searchParams, setSearchParams] = useSearchParams()
  const authModeParam = searchParams.get('auth')

  const isAuthOpen = authModeParam === 'login' || authModeParam === 'register'
  const authMode = authModeParam === 'register' ? 'register' : 'login'

  useEffect(() => {
    const theme = localStorage.getItem('vollmed-theme') || 'default'
    if (theme === 'default') {
      document.body.removeAttribute('data-theme')
    } else {
      document.body.setAttribute('data-theme', theme)
    }
  }, [])

  const handleNavToLogin = (registerMode: boolean) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('auth', registerMode ? 'register' : 'login')
    setSearchParams(newParams)
  }

  const handleCloseAuth = () => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('auth')
    setSearchParams(newParams)
  }

  return (
    <div className="landing-wrapper">
      {/* HEADER / NAVIGATION */}
      <motion.header 
        className="landing-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="landing-logo">
          <Activity size={28} className="logo-icon" />
          <span className="logo-text">VollMed</span>
        </div>
        <nav className="landing-nav">
          <a href="#inicio">Inicio</a>
          <a href="#beneficios">Beneficios</a>
          <a href="#profesionales">Profesionales</a>
          <a href="#tecnologia">Tecnología</a>
          <a href="#testimonios">Testimonios</a>
        </nav>
        <div className="landing-auth-buttons">
          <button 
            onClick={() => handleNavToLogin(false)} 
            className="btn btn-landing-outline"
          >
            Iniciar Sesión
          </button>
          <button 
            onClick={() => handleNavToLogin(true)} 
            className="btn btn-landing-solid"
          >
            Registrarse
          </button>
        </div>
      </motion.header>

      {/* SECTION 1: HERO */}
      <section id="inicio" className="landing-hero-section">
        <div className="landing-hero-container">
          <motion.div 
            className="landing-hero-text"
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div className="badge badge-landing-promo" variants={fadeInUp}>
              <HeartPulse size={14} />
              <span>Salud Digital de Vanguardia</span>
            </motion.div>
            <motion.h1 variants={fadeInUp}>Cuidamos tu salud, a tu ritmo y en tu espacio</motion.h1>
            <motion.p variants={fadeInUp}>
              Accede a videoconsultas con especialistas acreditados, gestiona tus turnos 
              médicos de forma ágil y lleva el control digital seguro de tu historia clínica.
            </motion.p>
            <motion.div className="landing-hero-actions" variants={fadeInUp}>
              <button onClick={() => handleNavToLogin(true)} className="btn btn-landing-solid btn-lg">
                Comenzar Registro <ArrowRight size={16} />
              </button>
              <a href="#beneficios" className="btn btn-landing-outline btn-lg">
                Conoce Más
              </a>
            </motion.div>
            
            <motion.div className="landing-hero-stats" variants={fadeInUp}>
              <div className="stat-item">
                <span className="stat-num">98%</span>
                <span className="stat-label">Satisfacción</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">+10k</span>
                <span className="stat-label">Consultas</span>
              </div>
              <div className="stat-item">
                <span className="stat-num">24/7</span>
                <span className="stat-label">Soporte Médico</span>
              </div>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="landing-hero-image-wrapper"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          >
            <div className="image-glass-border">
              <img 
                src="/img/med_con_paciente.png" 
                alt="Médica atendiendo a una paciente" 
                className="landing-hero-image"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 2: BENEFICIOS */}
      <section id="beneficios" className="landing-section bg-alt">
        <motion.div 
          className="landing-section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          <span className="section-subtitle">Beneficios del Sistema</span>
          <h2>Diseñado para simplificar tu cuidado médico</h2>
          <p className="section-desc">
            VollMed unifica todos los aspectos de la consulta médica tradicional con los beneficios y agilidad del entorno digital.
          </p>
        </motion.div>

        <motion.div 
          className="landing-benefits-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
        >
          {/* Card 1: Reserva de Turnos */}
          <motion.div className="landing-benefit-card glass-card" variants={cardScale}>
            <div className="benefit-img-wrapper">
              <img src="/img/turnos.png" alt="Reserva de turnos" />
            </div>
            <div className="benefit-content">
              <div className="benefit-icon-box">
                <Calendar size={20} />
              </div>
              <h3>Reserva Ágil de Turnos</h3>
              <p>
                Agenda y reprograma tus consultas en segundos. Elige al especialista y el horario que mejor se adapte a tu agenda sin llamadas telefónicas.
              </p>
              <ul className="benefit-list">
                <li><CheckCircle size={14} className="text-primary" /> Agendamiento 100% online</li>
                <li><CheckCircle size={14} className="text-primary" /> Recordatorios automáticos</li>
              </ul>
            </div>
          </motion.div>

          {/* Card 2: Videoconsulta */}
          <motion.div className="landing-benefit-card glass-card" variants={cardScale}>
            <div className="benefit-img-wrapper">
              <img src="/img/Videoconsulta.png" alt="Videoconsulta" />
            </div>
            <div className="benefit-content">
              <div className="benefit-icon-box">
                <Video size={20} />
              </div>
              <h3>Telemedicina Integrada</h3>
              <p>
                Recibe atención de calidad mediante videollamadas fluidas y estables. Conecta con tu especialista desde cualquier lugar.
              </p>
              <ul className="benefit-list">
                <li><CheckCircle size={14} className="text-primary" /> Conexión segura punto a punto</li>
                <li><CheckCircle size={14} className="text-primary" /> Ahorro de tiempo en traslados</li>
              </ul>
            </div>
          </motion.div>

          {/* Card 3: Historial Médico */}
          <motion.div className="landing-benefit-card glass-card" variants={cardScale}>
            <div className="benefit-img-wrapper">
              <img src="/img/historial_medico.png" alt="Historial médico" />
            </div>
            <div className="benefit-content">
              <div className="benefit-icon-box">
                <ShieldCheck size={20} />
              </div>
              <h3>Expediente Digital Seguro</h3>
              <p>
                Tu historial de salud y tus recetas en un solo lugar. Consulta indicaciones de medicación ingresando códigos de receta únicos.
              </p>
              <ul className="benefit-list">
                <li><CheckCircle size={14} className="text-primary" /> Indicaciones claras de recetas</li>
                <li><CheckCircle size={14} className="text-primary" /> Datos personales encriptados</li>
              </ul>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* SECTION 3: PROFESIONALES */}
      <section id="profesionales" className="landing-section">
        <div className="landing-two-column-layout">
          <motion.div 
            className="landing-column-image"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={slideInLeft}
          >
            <div className="image-glass-border">
              <img 
                src="/img/equipo_medico.png" 
                alt="Equipo médico real de VollMed" 
                style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-lg)', display: 'block' }}
              />
            </div>
          </motion.div>
          <motion.div 
            className="landing-column-text"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={slideInRight}
          >
            <span className="section-subtitle">Profesionales Destacados</span>
            <h2>Contamos con un equipo médico de excelencia</h2>
            <p>
              En VollMed, nuestro plantel está integrado por profesionales de la salud altamente calificados y rigurosamente validados en el sistema nacional de salud. 
            </p>
            <p style={{ marginTop: '15px' }}>
              Ofrecemos una amplia cobertura en especialidades médicas clave que incluyen Cardiología, Pediatría, Dermatología, Ginecología, Medicina General y Nutrición.
            </p>
            <div className="features-checklist" style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="checklist-item">
                <Users className="checklist-icon" size={18} />
                <div>
                  <h4>Médicos Certificados</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fichas verificadas con número de matrícula profesional.</p>
                </div>
              </div>
              <div className="checklist-item">
                <Clock className="checklist-icon" size={18} />
                <div>
                  <h4>Atención Continua</h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Seguimiento post-consulta para garantizar tu evolución.</p>
                </div>
              </div>
            </div>
            <div style={{ marginTop: '30px' }}>
              <button onClick={() => handleNavToLogin(true)} className="btn btn-landing-solid">
                Ver Directorio de Especialistas
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 4: TECNOLOGÍA */}
      <section id="tecnologia" className="landing-section bg-alt">
        <div className="landing-two-column-layout layout-reversed">
          <motion.div 
            className="landing-column-image"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={slideInRight}
          >
            <div className="image-glass-border">
              <img 
                src="/img/medico_tablet.png" 
                alt="Médico utilizando tablet o dashboard" 
                style={{ width: '100%', height: 'auto', borderRadius: 'var(--radius-lg)', display: 'block' }}
              />
            </div>
          </motion.div>
          <motion.div 
            className="landing-column-text"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={slideInLeft}
          >
            <span className="section-subtitle">Tecnología e Innovación</span>
            <h2>Salud inteligente impulsada por datos</h2>
            <p>
              Nuestra plataforma digital integra sistemas de gestión clínica en la nube. Médicos y pacientes interactúan a través de un panel de control interactivo que unifica diagnósticos y recetas digitales de forma transparente.
            </p>
            <div className="tech-specs" style={{ marginTop: '25px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="tech-spec-box glass-card">
                <Laptop size={20} className="text-primary" />
                <h4>Portal de Paciente</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Buscador de recetas médicas e historial.</p>
              </div>
              <div className="tech-spec-box glass-card">
                <ShieldCheck size={20} className="text-secondary" />
                <h4>Seguridad de Datos</h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Auditoría continua de accesos y tokens.</p>
              </div>
            </div>
            <div style={{ marginTop: '30px' }}>
              <button onClick={() => handleNavToLogin(true)} className="btn btn-landing-outline">
                Explorar Plataforma
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* SECTION 5: TESTIMONIOS */}
      <section id="testimonios" className="landing-section">
        <motion.div 
          className="landing-section-header"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={fadeInUp}
        >
          <span className="section-subtitle">Opiniones de Usuarios</span>
          <h2>Qué dicen nuestros pacientes</h2>
          <p className="section-desc">
            La confianza de miles de pacientes respalda la calidad médica y la eficiencia tecnológica de VollMed.
          </p>
        </motion.div>

        <motion.div 
          className="landing-testimonials-grid"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          variants={staggerContainer}
        >
          {/* Testimonio 1 */}
          <motion.div className="testimonial-card glass-card" variants={cardScale}>
            <div className="stars-wrapper">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="var(--color-accent)" color="var(--color-accent)" />
              ))}
            </div>
            <p className="testimonial-text">
              "Pude coordinar una consulta de cardiología y obtener la receta digital en menos de 10 minutos. El buscador de recetas es súper útil para recordar las dosis exactas."
            </p>
            <div className="testimonial-user">
              <div className="user-avatar">AM</div>
              <div className="user-info">
                <h4>Alejandro Mendoza</h4>
                <span className="user-tag">Paciente de Telemedicina</span>
              </div>
            </div>
          </motion.div>

          {/* Testimonio 2 */}
          <motion.div className="testimonial-card glass-card" variants={cardScale}>
            <div className="stars-wrapper">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="var(--color-accent)" color="var(--color-accent)" />
              ))}
            </div>
            <p className="testimonial-text">
              "Como madre, reservar turnos online de pediatría me ahorra esperas telefónicas. La interfaz es intuitiva y el historial médico está siempre al alcance."
            </p>
            <div className="testimonial-user">
              <div className="user-avatar">SR</div>
              <div className="user-info">
                <h4>Sofía Rodríguez</h4>
                <span className="user-tag">Paciente de Pediatría</span>
              </div>
            </div>
          </motion.div>

          {/* Testimonio 3 */}
          <motion.div className="testimonial-card glass-card" variants={cardScale}>
            <div className="stars-wrapper">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} fill="var(--color-accent)" color="var(--color-accent)" />
              ))}
            </div>
            <p className="testimonial-text">
              "Excelente atención. Me derivaron con un especialista en dermatología de forma muy ágil. La videoconsulta se ve perfecta y es muy segura."
            </p>
            <div className="testimonial-user">
              <div className="user-avatar">CP</div>
              <div className="user-info">
                <h4>Carlos Peralta</h4>
                <span className="user-tag">Paciente de Dermatología</span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <motion.footer 
        className="landing-footer"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        variants={fadeInUp}
      >
        <div className="footer-top">
          <div className="footer-brand">
            <div className="landing-logo">
              <Activity size={24} className="logo-icon" />
              <span className="logo-text" style={{ fontSize: '1.2rem' }}>VollMed</span>
            </div>
            <p>Líderes en telemedicina y gestión de salud digital privada.</p>
          </div>
          <div className="footer-links">
            <div>
              <h4>Servicios</h4>
              <a href="#beneficios">Turnos Online</a>
              <a href="#beneficios">Videoconsulta</a>
              <a href="#beneficios">Historial Clínico</a>
            </div>
            <div>
              <h4>Institucional</h4>
              <a href="#profesionales">Equipo Médico</a>
              <a href="#tecnologia">Tecnología</a>
              <a href="#testimonios">Testimonios</a>
            </div>
            <div>
              <h4>Legal</h4>
              <span style={{ cursor: 'pointer' }}>Términos de Servicio</span>
              <span style={{ cursor: 'pointer' }}>Privacidad de Datos</span>
              <span style={{ cursor: 'pointer' }}>Soporte Técnico</span>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} VollMed. Todos los derechos reservados. Cumplimiento de Normativa de Salud Digital ISO 27799.</p>
        </div>
      </motion.footer>
      <AnimatePresence>
        {isAuthOpen && (
          <AuthModal 
            isOpen={isAuthOpen}
            onClose={handleCloseAuth}
            initialMode={authMode}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
