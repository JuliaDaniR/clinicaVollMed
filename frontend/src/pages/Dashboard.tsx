import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { 
  Calendar, 
  Users, 
  ClipboardList, 
  Clock, 
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  Shield,
  HeartPulse,
  Search,
  Mail
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { api } from '../services/api'
import ContactModal, { type VollmedMessage } from '../components/ContactModal'

interface BookedConsulta {
  id: number
  idMedico: number
  idPaciente: number
  cancelada: boolean
}

const formatFriendlyDate = (dateStr: string) => {
  if (!dateStr) return ''
  const cleanStr = dateStr.replace('T', ' ')
  const parts = cleanStr.split(' ')
  const dPart = parts[0]
  const tPart = parts[1] || ''
  
  const dParts = dPart.split('-')
  if (dParts.length < 3) return dateStr
  
  const year = dParts[0]
  const month = dParts[1]
  const day = dParts[2]
  
  return `${day}/${month}/${year} - ${tPart} hs`
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const showToast = useToastStore(state => state.showToast)
  
  const [patientId, setPatientId] = useState<number | null>(null)
  const [bookedList, setBookedList] = useState<any[]>([])

  const fetchConsultas = async () => {
    try {
      const res = await api.get('/consultas')
      const mapped = (res.data || []).map((c: any) => ({
        ...c,
        fecha: c.fecha ? c.fecha.replace('T', ' ').substring(0, 16) : '',
        fechaPropuesta: c.fechaPropuesta ? c.fechaPropuesta.replace('T', ' ').substring(0, 16) : undefined
      }))
      setBookedList(mapped)
    } catch (e) {
      console.error('Error fetching consultations', e)
    }
  }

  useEffect(() => {
    fetchConsultas()
  }, [user])

  // Profile and Messages states
  const [userProfileName, setUserProfileName] = useState('')
  const [messages, setMessages] = useState<VollmedMessage[]>([])
  
  // Message modals state
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactRecipientName, setContactRecipientName] = useState('')
  const [contactRecipientEmail, setContactRecipientEmail] = useState('')
  const [replySubject, setReplySubject] = useState('')

  const loadMessages = () => {
    const raw = localStorage.getItem('vollmed-messages')
    if (raw) {
      setMessages(JSON.parse(raw))
    } else {
      setMessages([])
    }
  }

  useEffect(() => {
    loadMessages()
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vollmed-messages') {
        const oldMessages: VollmedMessage[] = e.oldValue ? JSON.parse(e.oldValue) : []
        const newMessages: VollmedMessage[] = e.newValue ? JSON.parse(e.newValue) : []
        
        const oldRecIds = new Set(oldMessages.filter(m => m.receiverEmail === user?.email).map(m => m.id))
        const newRec = newMessages.filter(m => m.receiverEmail === user?.email)
        
        const brandNew = newRec.filter(m => !oldRecIds.has(m.id))
        if (brandNew.length > 0) {
          brandNew.forEach(msg => {
            showToast(`Nuevo mensaje de ${msg.senderName}: "${msg.subject}"`, 'success')
          })
        }
        setMessages(newMessages)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user])



  const [stats, setStats] = useState({
    todayConsultas: 12,
    activeMedicos: 8,
    registeredPatients: 142,
    doctorAppointments: 0,
    patientAppointments: 0,
  })

  const hasRole = (roles: string[]) => {
    return user?.roles.some(r => roles.includes(r)) || false
  }

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const currentBookedList: BookedConsulta[] = bookedList
        
        let matchedDocId: number | null = null
        let matchedPatId: number | null = null
        
        if (hasRole(['ROLE_MEDICO'])) {
          try {
            const docRes = await api.get('/medicos?page=0&size=100')
            const matched = docRes.data.data.content?.find((m: any) => m.email === user?.email)
            if (matched) {
              matchedDocId = matched.id
              setUserProfileName(matched.nombre)
            }
          } catch (e) {
            console.error('Error fetching doctor matching info', e)
          }
        }
        
        if (hasRole(['ROLE_PACIENTE'])) {
          try {
            const patRes = await api.get('/pacientes?page=0&size=100')
            const matched = patRes.data.data.content?.find((p: any) => p.email === user?.email)
            if (matched) {
              matchedPatId = matched.id
              setPatientId(matched.id)
              setUserProfileName(matched.nombre)
            }
          } catch (e) {
            console.error('Error fetching patient matching info', e)
          }
        }

        if (!userProfileName) {
          if (hasRole(['ROLE_ADMIN'])) {
            setUserProfileName('Administrador')
          } else if (hasRole(['ROLE_RECEPCIONISTA'])) {
            setUserProfileName('Recepcionista')
          }
        }

        const docCount = matchedDocId 
          ? currentBookedList.filter(c => c.idMedico === matchedDocId && !c.cancelada).length 
          : 0
        const patCount = matchedPatId 
          ? currentBookedList.filter(c => c.idPaciente === matchedPatId && !c.cancelada).length 
          : 0

        setStats(prev => ({
          ...prev,
          doctorAppointments: docCount,
          patientAppointments: patCount
        }))
      } catch (err) {
        console.error('Error loading dashboard stats', err)
      }
    }

    fetchStats()
  }, [user, bookedList])

  const handleAcceptReschedule = async (appointmentId: number) => {
    try {
      const response = await api.put(`/consultas/${appointmentId}/aceptar-reprogramacion`)
      if (response.data.success) {
        showToast('Horario de consulta aceptado correctamente', 'success')
        await fetchConsultas()
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al aceptar el nuevo horario', 'error')
    }
  }

  const handleRejectAndKeep = async (appointmentId: number) => {
    try {
      const response = await api.put(`/consultas/${appointmentId}/rechazar-reprogramacion-mantener`)
      if (response.data.success) {
        showToast('Se ha mantenido el horario original de la consulta', 'success')
        await fetchConsultas()
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al rechazar propuesta', 'error')
    }
  }

  const handleRejectAndCancel = async (appointmentId: number) => {
    try {
      const response = await api.put(`/consultas/${appointmentId}/rechazar-reprogramacion-cancelar`)
      if (response.data.success) {
        showToast('Consulta cancelada correctamente', 'success')
        await fetchConsultas()
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al rechazar y cancelar consulta', 'error')
    }
  }

  // Recipe search state for patients
  const [searchRecipeId, setSearchRecipeId] = useState('')
  const [searchedRecipe, setSearchedRecipe] = useState<any | null>(null)
  const [loadingRecipe, setLoadingRecipe] = useState(false)

  const handleSearchRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchRecipeId) {
      showToast('Escribe el código de receta a buscar', 'error')
      return
    }

    setLoadingRecipe(true)
    setSearchedRecipe(null)
    try {
      const response = await api.get(`/recetas/${searchRecipeId}`)
      if (response.data.success) {
        setSearchedRecipe(response.data.data)
        showToast('Receta encontrada', 'success')
      }
    } catch (err: any) {
      console.error(err)
      showToast('No se encontró ninguna receta con el código indicado', 'error')
    } finally {
      setLoadingRecipe(false)
    }
  }

  return (
    <>
      <div className="header-actions">
        <div>
          <h1 className="page-title">Panel de Control</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Bienvenido al sistema de administración clínica integral de VollMed.
          </p>
        </div>
        <div className="badge badge-success" style={{ padding: '8px 16px', gap: '6px', alignItems: 'center' }}>
          <ShieldCheck size={14} />
          <span>Acceso Autorizado</span>
        </div>
      </div>

      {/* Notificación de Reprogramación Pendiente */}
      {hasRole(['ROLE_PACIENTE']) && patientId && (
        (() => {
          const pendingReschedules = bookedList.filter(
            c => c.idPaciente === patientId && c.reprogramadaPendiente && c.propuestaPorMedico
          )
          if (pendingReschedules.length === 0) return null
          
          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '30px' }}>
              {pendingReschedules.map(item => (
                <div 
                  key={item.id} 
                  className="glass-card" 
                  style={{ 
                    padding: '20px 24px', 
                    border: '1px solid var(--color-accent)', 
                    background: 'rgba(233, 196, 106, 0.03)',
                    boxShadow: '0 0 20px rgba(233, 196, 106, 0.08)',
                    display: 'flex', 
                    flexDirection: 'column', 
                    gap: '12px' 
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'rgba(233, 196, 106, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--color-accent)'
                    }}>
                      🔔
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.95rem', fontWeight: '700', fontFamily: 'var(--font-title)' }}>
                        Propuesta de cambio de horario
                      </h4>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        El Dr. <strong>{item.medicoNombre}</strong> ha propuesto reprogramar tu consulta del día <strong>{formatFriendlyDate(item.fecha)}</strong>.
                      </p>
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.9rem', padding: '10px 14px', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border-glass-hover)' }}>
                    Nuevo horario propuesto: <strong style={{ color: 'var(--color-accent)' }}>{formatFriendlyDate(item.fechaPropuesta || '')}</strong>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <button 
                      className="btn btn-primary" 
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      onClick={() => handleAcceptReschedule(item.id)}
                    >
                      Aceptar Nuevo Horario
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      onClick={() => handleRejectAndKeep(item.id)}
                    >
                      Rechazar y Mantener Original
                    </button>
                    <button 
                      className="btn btn-danger" 
                      style={{ padding: '8px 16px', fontSize: '0.8rem' }}
                      onClick={() => handleRejectAndCancel(item.id)}
                    >
                      Rechazar y Cancelar Cita
                    </button>
                    <button 
                      className="btn btn-secondary" 
                      style={{ padding: '8px 16px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                      onClick={async () => {
                        let docEmail = 'medico@vollmed.com'
                        try {
                          const docRes = await api.get('/medicos?page=0&size=100')
                          const docObj = docRes.data.data.content?.find((m: any) => m.id === item.idMedico)
                          if (docObj) docEmail = docObj.email
                        } catch (e) {
                          console.error(e)
                        }
                        setContactRecipientName(`Dr. ${item.medicoNombre}`)
                        setContactRecipientEmail(docEmail)
                        setReplySubject('Propuesta de reprogramación de consulta - VollMed')
                        setIsContactOpen(true)
                      }}
                    >
                      ✉️ Contactar al Médico
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        })()
      )}

      {/* Grid de Estadísticas Dinámicas por Rol */}
      <div className="dashboard-grid">
        {hasRole(['ROLE_MEDICO']) ? (
          <>
            <div className="glass-card stat-card">
              <div className="stat-title">Mis Citas Programadas</div>
              <div className="stat-value">{stats.doctorAppointments}</div>
              <div className="stat-desc">
                <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                <span>Citas activas en tu agenda</span>
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-title">Pacientes de la Clínica</div>
              <div className="stat-value">{stats.registeredPatients}</div>
              <div className="stat-desc">Fichas clínicas activas</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-title">Médicos en el Sistema</div>
              <div className="stat-value">{stats.activeMedicos}</div>
              <div className="stat-desc">Colegas activos</div>
            </div>
          </>
        ) : hasRole(['ROLE_PACIENTE']) ? (
          <>
            <div className="glass-card stat-card">
              <div className="stat-title">Mis Próximas Citas</div>
              <div className="stat-value">{stats.patientAppointments}</div>
              <div className="stat-desc">
                <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                <span>Consultas agendadas</span>
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-title">Estado de Cuenta</div>
              <div className="stat-value" style={{ fontSize: '1.8rem', color: 'var(--color-primary)' }}>ACTIVO</div>
              <div className="stat-desc">Afiliado de VollMed</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-title">Cobertura Médica</div>
              <div className="stat-value" style={{ fontSize: '1.8rem' }}>100%</div>
              <div className="stat-desc">Plan Platinum Integral</div>
            </div>
          </>
        ) : (
          <>
            <div className="glass-card stat-card">
              <div className="stat-title">Consultas de Hoy</div>
              <div className="stat-value">{stats.todayConsultas}</div>
              <div className="stat-desc">
                <Clock size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                <span>4 consultas pendientes</span>
              </div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-title">Médicos Disponibles</div>
              <div className="stat-value">{stats.activeMedicos}</div>
              <div className="stat-desc">3 especialidades activas</div>
            </div>
            <div className="glass-card stat-card">
              <div className="stat-title">Pacientes Registrados</div>
              <div className="stat-value">{stats.registeredPatients}</div>
              <div className="stat-desc">+5 ingresados esta semana</div>
            </div>
          </>
        )}
      </div>

      {/* Secciones del Dashboard */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px' }}>
        
        {/* Columna Izquierda: Acciones y Recetas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Enlaces de Acción Rápida */}
          <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
              Acciones Rápidas
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              {/* ROLE_ADMIN y ROLE_RECEPCIONISTA */}
              {hasRole(['ROLE_ADMIN', 'ROLE_RECEPCIONISTA']) && (
                <>
                  <Link to="/consultas" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px 20px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Calendar size={18} className="text-primary" />
                      Agendar Consulta Médica
                    </span>
                    <ArrowRight size={16} />
                  </Link>

                  <Link to="/pacientes" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px 20px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Users size={18} className="text-primary" />
                      Registrar Nuevo Paciente
                    </span>
                    <ArrowRight size={16} />
                  </Link>
                </>
              )}

              {/* ROLE_PACIENTE */}
              {hasRole(['ROLE_PACIENTE']) && (
                <Link to="/consultas" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px 20px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Calendar size={18} className="text-primary" />
                    Agendar Nueva Consulta
                  </span>
                  <ArrowRight size={16} />
                </Link>
              )}

              {/* ROLE_MEDICO */}
              {hasRole(['ROLE_MEDICO']) && (
                <Link to="/mi-agenda" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px 20px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={18} className="text-primary" />
                    Mi Agenda y Turnos
                  </span>
                  <ArrowRight size={16} />
                </Link>
              )}

              {/* ROLE_ADMIN, ROLE_MEDICO */}
              {hasRole(['ROLE_ADMIN', 'ROLE_MEDICO']) && (
                <Link to="/historia-clinica" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px 20px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <ClipboardList size={18} className="text-primary" />
                    Expediente / Historia Clínica
                  </span>
                  <ArrowRight size={16} />
                </Link>
              )}

              {/* Todos los usuarios autorizados para ver Médicos */}
              {hasRole(['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_MEDICO']) && (
                <Link to="/medicos" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px 20px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Stethoscope size={18} className="text-primary" />
                    Directorio de Médicos
                  </span>
                  <ArrowRight size={16} />
                </Link>
              )}

              {/* ROLE_ADMIN Exclusivo */}
              {hasRole(['ROLE_ADMIN']) && (
                <Link to="/administracion" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px 20px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Shield size={18} className="text-primary" />
                    Panel de Administración de Usuarios
                  </span>
                  <ArrowRight size={16} />
                </Link>
              )}

              <Link to="/mensajes" className="btn btn-secondary" style={{ justifyContent: 'space-between', padding: '16px 20px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Mail size={18} className="text-primary" />
                  Bandeja de Mensajes
                </span>
                {messages.filter(m => m.receiverEmail === user?.email && !m.leido).length > 0 ? (
                  <span style={{
                    background: 'var(--color-danger)',
                    color: 'white',
                    fontSize: '0.75rem',
                    padding: '2px 8px',
                    borderRadius: '10px',
                    fontWeight: '700'
                  }}>
                    {messages.filter(m => m.receiverEmail === user?.email && !m.leido).length} nuevos
                  </span>
                ) : (
                  <ArrowRight size={16} />
                )}
              </Link>
            </div>
          </div>

          {/* Buscador de Recetas Clínicas (Sólo para el Paciente) */}
          {hasRole(['ROLE_PACIENTE']) && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Search className="text-secondary" size={22} />
                Mi Receta Médica
              </h2>

              <form onSubmit={handleSearchRecipe}>
                <div className="form-group">
                  <label htmlFor="rec-search-id">Código de Receta Digital</label>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      id="rec-search-id"
                      type="text"
                      className="input-glass"
                      placeholder="Ej. 1"
                      value={searchRecipeId}
                      onChange={e => setSearchRecipeId(e.target.value)}
                      style={{ flexGrow: 1 }}
                      disabled={loadingRecipe}
                    />
                    <button type="submit" className="btn btn-secondary" style={{ padding: '12px' }} disabled={loadingRecipe}>
                      <Search size={18} />
                    </button>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Introduce el código numérico provisto por tu médico para consultar las indicaciones.
                  </span>
                </div>
              </form>

              {loadingRecipe && (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '10px 0' }}>Buscando receta...</div>
              )}

              {/* Receta Card */}
              {searchedRecipe && (
                <div 
                  className="glass-card" 
                  style={{ 
                    marginTop: '20px', 
                    padding: '24px', 
                    background: 'rgba(255, 255, 255, 0.02)', 
                    border: '1px dashed var(--color-primary)',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <div style={{ 
                    position: 'absolute', 
                    top: '-10px', 
                    right: '-10px', 
                    width: '60px', 
                    height: '60px', 
                    background: 'rgba(107, 144, 128, 0.05)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    color: 'rgba(107, 144, 128, 0.1)',
                    fontWeight: '700',
                    userSelect: 'none'
                  }}>Rx</div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>RECETA DIGITAL</span>
                      <span>{searchedRecipe.fecha}</span>
                    </div>
                  </div>

                  <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '8px' }}>Indicaciones de Medicación:</h4>
                  <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                    "{searchedRecipe.indicaciones}"
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Columna Derecha: Perfil de Acceso */}
        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px' }}>
            Perfil de Acceso
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Identificación de Usuario:</span>
              <span style={{ fontWeight: '500' }}>{user?.id}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--text-muted)' }}>Email de Trabajo:</span>
              <span style={{ fontWeight: '500' }}>{user?.email}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Roles de Seguridad:</span>
              <span style={{ fontWeight: '700', color: 'var(--color-primary)' }}>
                {user?.roles.join(', ').replace(/ROLE_/g, '')}
              </span>
            </div>
          </div>
          <div className="glass-card" style={{ padding: '16px', background: 'rgba(20, 184, 166, 0.03)', border: '1px dashed rgba(20, 184, 166, 0.2)', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <HeartPulse size={18} className="text-primary" />
            <span>Toda actividad en el sistema está sujeta a la norma de seguridad ISO 27799 y auditoría clínica.</span>
          </div>
        </div>
      </div>

      {/* Modal de Envío de Mensaje */}
      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        recipientName={contactRecipientName}
        recipientEmail={contactRecipientEmail}
        senderName={userProfileName || 'Usuario VollMed'}
        senderEmail={user?.email || ''}
        defaultSubject={replySubject}
        hideEmail={user?.roles.includes('ROLE_PACIENTE')}
      />
    </>
  )
}
