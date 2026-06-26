import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useToastStore } from '../store/toastStore'
import { useAuthStore } from '../store/authStore'
import { 
  Calendar, 
  Trash2, 
  RefreshCw, 
  X,
  FileSpreadsheet,
  Mail
} from 'lucide-react'
import ContactModal from '../components/ContactModal'

interface Doctor {
  id: number
  nombre: string
  especialidad: string
  email: string
}

interface Patient {
  id: number
  nombre: string
  email: string
  parentesco?: string | null
}

interface Turno {
  id: number
  fecha: string
  hora: string
  estado: string
}

interface BookedConsulta {
  id: number
  idMedico: number
  medicoNombre: string
  idPaciente: number
  pacienteNombre: string
  fecha: string
  cancelada: boolean
  motivoCancelamiento?: string | null
  reprogramadaPendiente?: boolean
  fechaPropuesta?: string
  propuestaPorMedico?: boolean
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

export default function Consultas() {
  const showToast = useToastStore(state => state.showToast)
  const { user } = useAuthStore()
  const isPaciente = user?.roles.includes('ROLE_PACIENTE')
  
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactRecipientName, setContactRecipientName] = useState('')
  const [contactRecipientEmail, setContactRecipientEmail] = useState('')
  
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [turnos, setTurnos] = useState<Turno[]>([])
  
  // Form Booking State
  const [selectedDoctorId, setSelectedDoctorId] = useState('')
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [selectedTurnoId, setSelectedTurnoId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [bookingMonth, setBookingMonth] = useState('')
  const [showAllBookingDays, setShowAllBookingDays] = useState(false)
  const [reprogramDate, setReprogramDate] = useState('')
  const [reprogramMonth, setReprogramMonth] = useState('')
  const [showAllReprogramDays, setShowAllReprogramDays] = useState(false)
  const [motivo, setMotivo] = useState('')
  
  // List of booked consultations
  const [bookedList, setBookedList] = useState<BookedConsulta[]>([])

  // Cancel/Reprogram Override States
  const [cancelReason, setCancelReason] = useState('PACIENTE_DESISTIO')
  const [reprogramNewTurnoId, setReprogramNewTurnoId] = useState('')
  
  // Modal controllers
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isReprogramModalOpen, setIsReprogramModalOpen] = useState(false)
  const [activeConsulta, setActiveConsulta] = useState<BookedConsulta | null>(null)

  const [loadingDoctors, setLoadingDoctors] = useState(true)
  const [loadingPatients, setLoadingPatients] = useState(true)
  const [loadingTurnos, setLoadingTurnos] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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
      showToast('Error al cargar la lista de consultas', 'error')
    }
  }

  const handleAcceptReschedule = async (appointmentId: number) => {
    setSubmitting(true)
    try {
      const response = await api.put(`/consultas/${appointmentId}/aceptar-reprogramacion`)
      if (response.data.success) {
        showToast('Horario de consulta aceptado correctamente', 'success')
        await fetchConsultas()
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al aceptar el nuevo horario', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectAndKeep = async (appointmentId: number) => {
    setSubmitting(true)
    try {
      const response = await api.put(`/consultas/${appointmentId}/rechazar-reprogramacion-mantener`)
      if (response.data.success) {
        showToast('Se ha mantenido el horario original de la consulta', 'success')
        await fetchConsultas()
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al rechazar propuesta', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRejectAndCancel = async (appointmentId: number) => {
    setSubmitting(true)
    try {
      const response = await api.put(`/consultas/${appointmentId}/rechazar-reprogramacion-cancelar`)
      if (response.data.success) {
        showToast('Consulta cancelada correctamente', 'success')
        await fetchConsultas()
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al rechazar y cancelar consulta', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Fetch doctors, patients and consultations
  const fetchData = async () => {
    try {
      const docRes = await api.get('/medicos?page=0&size=100')
      if (docRes.data.success) {
        setDoctors(docRes.data.data.content || [])
      }
    } catch (e) {
      console.error(e)
      showToast('Error al cargar médicos', 'error')
    } finally {
      setLoadingDoctors(false)
    }

    try {
      const patRes = await api.get('/pacientes?page=0&size=100')
      if (patRes.data.success) {
        const patientList: Patient[] = patRes.data.data.content || []
        setPatients(patientList)
        // Si es paciente, auto-seleccionar al titular (quien tiene su email) por defecto
        if (isPaciente && patientList.length >= 1) {
          const titular = patientList.find(p => p.email === user?.email)
          if (titular) {
            setSelectedPatientId(String(titular.id))
          } else {
            setSelectedPatientId(String(patientList[0].id))
          }
        }
      }
    } catch (e) {
      console.error(e)
      showToast('Error al cargar pacientes', 'error')
    } finally {
      setLoadingPatients(false)
    }

    await fetchConsultas()
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getMonthName = (yearMonthStr: string) => {
    const parts = yearMonthStr.split('-')
    if (parts.length < 2) return yearMonthStr
    const month = parseInt(parts[1], 10) - 1
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ]
    return `${months[month]} ${parts[0]}`
  }

  const formatDateLabel = (dateStr: string) => {
    const parts = dateStr.split('-')
    if (parts.length < 3) return { dayName: '', dayNum: dateStr, monthName: '' }
    const year = parseInt(parts[0], 10)
    const month = parseInt(parts[1], 10) - 1
    const day = parseInt(parts[2], 10)
    const date = new Date(year, month, day)
    
    const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
    
    return {
      dayName: days[date.getDay()],
      dayNum: parts[2],
      monthName: months[date.getMonth()]
    }
  }

  // Fetch turnos when doctor changes (or for reprogram)
  const fetchTurnos = async (doctorId: string, isForReprogram = false) => {
    if (!doctorId) {
      setTurnos([])
      if (isForReprogram) {
        setReprogramDate('')
      } else {
        setSelectedTurnoId('')
        setBookingDate('')
      }
      return
    }
    setLoadingTurnos(true)
    try {
      const res = await api.get(`/turnos/medico/${doctorId}`)
      if (res.data.status === 'success') {
        const fetched = res.data.data || []
        setTurnos(fetched)
        const available = fetched.filter((t: any) => t.estado === 'DISPONIBLE')
        const uniqueDates: string[] = Array.from(new Set(available.map((t: any) => t.fecha as string))).sort() as string[]
        const uniqueMonths: string[] = Array.from(new Set(uniqueDates.map((d: string) => d.substring(0, 7)))).sort()
        
        if (isForReprogram) {
          setShowAllReprogramDays(false)
          if (uniqueMonths.length > 0) {
            setReprogramMonth(uniqueMonths[0])
            const daysInMonth = uniqueDates.filter((d: any) => d.startsWith(uniqueMonths[0]))
            setReprogramDate(daysInMonth[0] || '')
          } else {
            setReprogramMonth('')
            setReprogramDate('')
          }
        } else {
          setShowAllBookingDays(false)
          if (uniqueMonths.length > 0) {
            setBookingMonth(uniqueMonths[0])
            const daysInMonth = uniqueDates.filter((d: any) => d.startsWith(uniqueMonths[0]))
            setBookingDate(daysInMonth[0] || '')
          } else {
            setBookingMonth('')
            setBookingDate('')
          }
        }
      }
    } catch (e) {
      console.error(e)
      showToast('Error al cargar turnos disponibles', 'error')
    } finally {
      setLoadingTurnos(false)
    }
  }

  useEffect(() => {
    if (isReprogramModalOpen && activeConsulta) {
      fetchTurnos(String(activeConsulta.idMedico), true)
    } else {
      fetchTurnos(selectedDoctorId, false)
    }
  }, [selectedDoctorId, isReprogramModalOpen, activeConsulta])

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedTurnoId) {
      showToast('Por favor selecciona un turno disponible', 'error')
      return
    }
    if (!selectedPatientId) {
      showToast('Por favor selecciona un paciente', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post('/consultas', {
        idTurno: Number(selectedTurnoId),
        idPaciente: Number(selectedPatientId),
        motivoConsulta: motivo || 'Consulta general de rutina'
      })

      if (response.data.success) {
        showToast('Consulta agendada correctamente', 'success')
        
        await fetchConsultas()
        
        setSelectedDoctorId('')
        setMotivo('')
        setSelectedTurnoId('')
        setBookingDate('')
        setBookingMonth('')
        setTurnos([])
        
        if (isPaciente && patients.length >= 1) {
          const titular = patients.find(p => p.email === user?.email)
          if (titular) {
            setSelectedPatientId(String(titular.id))
          } else {
            setSelectedPatientId(String(patients[0].id))
          }
        } else {
          setSelectedPatientId('')
        }
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al agendar la consulta'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Cancel Consultation Call
  const handleCancelConsulta = async (id: number, reason: string) => {
    setSubmitting(true)
    try {
      const response = await api.delete('/consultas', {
        data: {
          idConsulta: id,
          motivo: reason
        }
      })
      if (response.data.success) {
        showToast('Consulta cancelada correctamente', 'success')
        await fetchConsultas()
        setIsCancelModalOpen(false)
        if (selectedDoctorId) fetchTurnos(selectedDoctorId)
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al cancelar la consulta'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  // Reprogram Consultation Call
  const handleReprogramConsulta = async (id: number, newTurnoId: number) => {
    if (!newTurnoId) {
      showToast('Selecciona un nuevo turno disponible', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.put('/consultas/reprogramar', {
        idConsulta: id,
        idNuevoTurno: newTurnoId
      })
      if (response.data.success) {
        showToast('Consulta reprogramada correctamente', 'success')
        await fetchConsultas()
        setIsReprogramModalOpen(false)
        setReprogramNewTurnoId('')
        if (selectedDoctorId) fetchTurnos(selectedDoctorId)
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al reprogramar la consulta'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }


  return (
    <>
      <div className="header-actions">
        <div>
          <h1 className="page-title">Agendamiento de Consultas</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Reserva turnos de médicos activos, reprograma citas y gestiona cancelaciones.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Formulario de Reserva */}
        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar className="text-primary" size={22} />
            Nueva Cita Médica
          </h2>

          <form onSubmit={handleBook}>
            {/* Seleccionar Médico */}
            <div className="form-group">
              <label htmlFor="medico-select">Profesional Médico</label>
              <select
                id="medico-select"
                className="input-glass"
                value={selectedDoctorId}
                onChange={e => setSelectedDoctorId(e.target.value)}
                style={{ background: 'var(--bg-obsidian-darker)', width: '100%' }}
                disabled={loadingDoctors || submitting}
              >
                <option value="">-- Selecciona un médico --</option>
                {doctors.map(doc => (
                  <option key={doc.id} value={doc.id}>
                    Dr. {doc.nombre} ({doc.especialidad.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

            {/* Seleccionar Turno */}
            <div className="form-group">
              <label>Turno Disponible</label>
              {loadingTurnos ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', padding: '12px 0' }}>Cargando agenda...</div>
              ) : !selectedDoctorId ? (
                <div className="input-glass" style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed' }}>
                  Selecciona primero un médico
                </div>
              ) : turnos.filter(t => t.estado === 'DISPONIBLE').length === 0 ? (
                <div className="input-glass" style={{ color: 'var(--color-danger)', background: 'rgba(239, 68, 68, 0.05)', borderStyle: 'dashed', borderColor: 'rgba(239, 68, 68, 0.2)' }}>
                  El médico no tiene turnos disponibles configurados
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Selector de Mes (Pestañas) */}
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Selecciona el Mes:</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Array.from(new Set(turnos.filter(t => t.estado === 'DISPONIBLE').map(t => t.fecha.substring(0, 7)))).sort().map(monthStr => {
                        const isSelected = bookingMonth === monthStr
                        return (
                          <button
                            key={monthStr}
                            type="button"
                            className="btn"
                            style={{
                              background: isSelected ? 'rgba(107, 144, 128, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                              borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-glass)',
                              color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                              padding: '6px 14px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              border: '1px solid'
                            }}
                            onClick={() => {
                              setBookingMonth(monthStr)
                              setShowAllBookingDays(false)
                              const daysInMonth = Array.from(new Set(turnos.filter(t => t.estado === 'DISPONIBLE').map(t => t.fecha))).sort().filter(d => d.startsWith(monthStr))
                              if (daysInMonth.length > 0) {
                                setBookingDate(daysInMonth[0])
                                setSelectedTurnoId('')
                              }
                            }}
                          >
                            {getMonthName(monthStr)}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selector de Día (Grilla que se ajusta a lo ancho) */}
                  {bookingMonth && (
                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Selecciona el Día:</span>
                      
                      {(() => {
                        const daysInMonth = Array.from(new Set(turnos.filter(t => t.estado === 'DISPONIBLE').map(t => t.fecha))).sort().filter(d => d.startsWith(bookingMonth))
                        const displayedDays = showAllBookingDays ? daysInMonth : daysInMonth.slice(0, 6)
                        
                        return (
                          <>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                              {displayedDays.map(dateStr => {
                                const isSelected = bookingDate === dateStr
                                const { dayName, dayNum } = formatDateLabel(dateStr)
                                return (
                                  <button
                                    key={dateStr}
                                    type="button"
                                    className="btn"
                                    style={{
                                      background: isSelected ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'rgba(255,255,255,0.02)',
                                      border: isSelected ? 'none' : '1px solid var(--border-glass)',
                                      color: isSelected ? 'var(--bg-obsidian-darker)' : 'var(--text-muted)',
                                      padding: '8px 12px',
                                      flexDirection: 'column',
                                      gap: '1px',
                                      width: '65px',
                                      height: '52px',
                                      flexShrink: 0
                                    }}
                                    onClick={() => {
                                      setBookingDate(dateStr)
                                      setSelectedTurnoId('')
                                    }}
                                  >
                                    <span style={{ fontSize: '0.65rem', fontWeight: '800', color: isSelected ? 'var(--bg-obsidian-darker)' : 'var(--color-primary)', letterSpacing: '0.05em' }}>
                                      {dayName.toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: isSelected ? 'var(--bg-obsidian-darker)' : 'var(--text-main)' }}>
                                      {dayNum}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                            
                            {daysInMonth.length > 6 && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', marginTop: '6px', width: '100%' }}
                                onClick={() => setShowAllBookingDays(!showAllBookingDays)}
                              >
                                {showAllBookingDays ? 'Ver Menos Días' : `Ver Más Días (+${daysInMonth.length - 6})`}
                              </button>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Horarios del Día Seleccionado (Compacto en 2 o más líneas a lo ancho) */}
                  {bookingDate && (
                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Selecciona la Hora:</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '8px' }}>
                        {turnos.filter(t => t.estado === 'DISPONIBLE' && t.fecha === bookingDate).map(t => {
                          const isSelected = selectedTurnoId === String(t.id)
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className="btn"
                              style={{
                                background: isSelected ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'rgba(255,255,255,0.03)',
                                border: isSelected ? 'none' : '1px solid var(--border-glass)',
                                color: isSelected ? 'var(--bg-obsidian-darker)' : 'var(--text-main)',
                                padding: '8px 4px',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                textAlign: 'center'
                              }}
                              onClick={() => setSelectedTurnoId(String(t.id))}
                              disabled={submitting}
                            >
                              {t.hora.substring(0, 5)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Seleccionar Paciente */}
            <div className="form-group" style={{ marginTop: '20px' }}>
              <label htmlFor="paciente-select">
                Paciente Beneficiario
                {isPaciente && patients.length > 1 && (
                  <span style={{
                    marginLeft: '8px',
                    fontSize: '0.7rem',
                    background: 'rgba(107, 144, 128, 0.15)',
                    color: 'var(--color-primary)',
                    padding: '2px 8px',
                    borderRadius: '20px',
                    border: '1px solid rgba(107, 144, 128, 0.3)',
                    fontWeight: '600'
                  }}>
                    Grupo familiar
                  </span>
                )}
              </label>
              {isPaciente && patients.length === 1 ? (
                // Paciente individual: campo de solo lectura
                <div
                  className="input-glass"
                  style={{
                    background: 'rgba(107, 144, 128, 0.05)',
                    borderColor: 'rgba(107, 144, 128, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'default',
                    userSelect: 'none'
                  }}
                >
                  <span style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.7rem',
                    fontWeight: '800',
                    color: 'var(--bg-obsidian-darker)',
                    flexShrink: 0
                  }}>
                    {patients[0]?.nombre?.charAt(0).toUpperCase()}
                  </span>
                  <span style={{ fontWeight: '600' }}>{patients[0]?.nombre}</span>
                  <span style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'var(--text-muted)' }}>Tú</span>
                </div>
              ) : (
                // Grupo familiar o Admin/Recepcionista: selector habilitado
                <select
                  id="paciente-select"
                  className="input-glass"
                  value={selectedPatientId}
                  onChange={e => setSelectedPatientId(e.target.value)}
                  style={{ background: 'var(--bg-obsidian-darker)', width: '100%' }}
                  disabled={loadingPatients || submitting}
                >
                  <option value="">
                    {isPaciente ? '-- Selecciona un miembro del grupo familiar --' : '-- Selecciona un paciente --'}
                  </option>
                  {patients.map(pat => {
                    let suffix = ''
                    if (isPaciente) {
                      if (pat.email === user?.email) {
                        suffix = ' (Tú)'
                      } else if (pat.parentesco) {
                        const labels: Record<string, string> = {
                          'HIJO_A': 'Hijo/a',
                          'CONYUGUE': 'Cónyuge',
                          'PADRE_MADRE': 'Padre/Madre',
                          'HERMANO_A': 'Hermano/a',
                          'ABUELO_A': 'Abuelo/a',
                          'NIETO_A': 'Nieto/a',
                          'TUTOR_LEGAL': 'Tutor Legal',
                          'OTRO': 'Otro'
                        }
                        suffix = ` (${labels[pat.parentesco] || pat.parentesco})`
                      }
                    }
                    return (
                      <option key={pat.id} value={pat.id}>
                        {pat.nombre}{suffix}
                      </option>
                    )
                  })}
                </select>
              )}
            </div>

            {/* Motivo de Consulta */}
            <div className="form-group">
              <label htmlFor="motivo-input">Motivo / Síntomas</label>
              <textarea
                id="motivo-input"
                className="input-glass"
                placeholder="Ej. Control anual de cardiología, dolor de pecho, etc."
                value={motivo}
                onChange={e => setMotivo(e.target.value)}
                style={{ width: '100%', minHeight: '80px', resize: 'vertical' }}
                disabled={submitting}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '20px' }}
              disabled={submitting || !selectedTurnoId || !selectedPatientId}
            >
              {submitting ? 'Agendando...' : 'Agendar Consulta'}
            </button>
          </form>
        </div>

        {/* Panel de Consultas Agendadas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="glass-card" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet className="text-secondary" size={22} />
              Citas Agendadas Recientes
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {bookedList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '20px 0' }}>
                  No has registrado consultas en esta sesión de trabajo.
                </p>
              ) : (
                bookedList.map(item => (
                  <div 
                    key={item.id} 
                    className="glass-card" 
                    style={{ 
                      padding: '16px', 
                      background: 'rgba(255,255,255,0.02)',
                      borderLeft: '4px solid',
                      borderColor: item.cancelada ? 'var(--color-danger)' : 'var(--color-primary)',
                      opacity: item.cancelada ? 0.6 : 1
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      <span>CITA RECIENTE</span>
                      <span>{formatFriendlyDate(item.fecha)}</span>
                    </div>

                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                      Dr. {item.medicoNombre} ➡️ {item.pacienteNombre}
                    </div>

                    {item.cancelada ? (
                      <div style={{ fontSize: '0.8rem', color: 'var(--color-danger)', marginTop: '8px', fontWeight: '600' }}>
                        Cancelada por: {item.motivoCancelamiento?.replace('_', ' ')}
                      </div>
                    ) : item.reprogramadaPendiente && item.propuestaPorMedico ? (
                      <div style={{ marginTop: '12px' }}>
                        <div style={{ fontSize: '0.82rem', padding: '8px 10px', background: 'rgba(233, 196, 106, 0.05)', borderRadius: 'var(--radius-sm)', border: '1px dashed rgba(233, 196, 106, 0.3)', marginBottom: '10px' }}>
                          ⚠️ Dr. propuso cambio al: <strong style={{ color: 'var(--color-accent)' }}>{formatFriendlyDate(item.fechaPropuesta || '')}</strong>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <button
                            className="btn btn-primary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', width: '100%' }}
                            onClick={() => handleAcceptReschedule(item.id)}
                          >
                            Aceptar nuevo horario
                          </button>
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1 }}
                              onClick={() => handleRejectAndKeep(item.id)}
                            >
                              Mantener original
                            </button>
                            <button
                              className="btn btn-danger"
                              style={{ padding: '6px 12px', fontSize: '0.75rem', flex: 1 }}
                              onClick={() => handleRejectAndCancel(item.id)}
                            >
                              Cancelar cita
                            </button>
                          </div>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', width: '100%', gap: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            onClick={() => {
                              const email = doctors.find(d => d.id === item.idMedico)?.email || 'medico@vollmed.com'
                              setContactRecipientName(`Dr. ${item.medicoNombre}`)
                              setContactRecipientEmail(email)
                              setIsContactOpen(true)
                            }}
                          >
                            <Mail size={12} />
                            <span>Contactar al Médico</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem', flex: '1 1 30%' }}
                          onClick={() => {
                            setActiveConsulta(item)
                            setIsReprogramModalOpen(true)
                          }}
                        >
                          <RefreshCw size={12} />
                          <span>Reprogramar</span>
                        </button>
                        <button 
                          className="btn btn-danger" 
                          style={{ padding: '6px 12px', fontSize: '0.75rem', flex: '1 1 30%' }}
                          onClick={() => {
                            setActiveConsulta(item)
                            setIsCancelModalOpen(true)
                          }}
                        >
                          <Trash2 size={12} />
                          <span>Cancelar</span>
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: '0.75rem', flex: '1 1 30%', display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                          onClick={() => {
                            const email = doctors.find(d => d.id === item.idMedico)?.email || 'medico@vollmed.com'
                            setContactRecipientName(`Dr. ${item.medicoNombre}`)
                            setContactRecipientEmail(email)
                            setIsContactOpen(true)
                          }}
                        >
                          <Mail size={12} />
                          <span>Contactar</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* MODAL: CANCELACIÓN DE CITA */}
      {isCancelModalOpen && activeConsulta && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Cancelar Consulta</h2>
              <button className="close-btn" onClick={() => setIsCancelModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              ¿Deseas cancelar la cita con el Dr. {activeConsulta.medicoNombre} reservada para {activeConsulta.pacienteNombre}?
            </p>

            <div className="form-group">
              <label htmlFor="modal-cancel-reason">Motivo de la Cancelación</label>
              <select
                id="modal-cancel-reason"
                className="input-glass"
                value={cancelReason}
                onChange={e => setCancelReason(e.target.value)}
                style={{ background: 'var(--bg-obsidian-darker)', width: '100%' }}
              >
                <option value="PACIENTE_DESISTIO">Paciente Desistió</option>
                <option value="MEDICO_CANCELO">Médico Canceló</option>
                <option value="ERROR_ADMINISTRATIVO">Error Administrativo</option>
                <option value="AUSENCIA_PACIENTE">Ausencia de Paciente</option>
                <option value="PROBLEMA_DE_SALUD">Problema de Salud</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setIsCancelModalOpen(false)} disabled={submitting}>
                Cerrar
              </button>
              <button 
                className="btn btn-danger" 
                onClick={() => handleCancelConsulta(activeConsulta.id, cancelReason)}
                disabled={submitting}
              >
                Confirmar Cancelación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: REPROGRAMACIÓN DE CITA */}
      {isReprogramModalOpen && activeConsulta && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Reprogramar Consulta</h2>
              <button className="close-btn" onClick={() => {
                setIsReprogramModalOpen(false)
                setReprogramNewTurnoId('')
              }}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Selecciona un nuevo turno libre de la agenda del Dr. {activeConsulta.medicoNombre} para reprogramar esta cita.
            </p>

            <div className="form-group">
              <label>Seleccionar Nuevo Turno</label>
              {loadingTurnos ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cargando agenda...</div>
              ) : turnos.filter(t => t.estado === 'DISPONIBLE').length === 0 ? (
                <div style={{ color: 'var(--color-danger)', fontSize: '0.85rem' }}>El médico no tiene más turnos disponibles configurados.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  
                  {/* Selector de Mes (Pestañas) */}
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Selecciona el Mes:</span>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      {Array.from(new Set(turnos.filter(t => t.estado === 'DISPONIBLE').map(t => t.fecha.substring(0, 7)))).sort().map(monthStr => {
                        const isSelected = reprogramMonth === monthStr
                        return (
                          <button
                            key={monthStr}
                            type="button"
                            className="btn"
                            style={{
                              background: isSelected ? 'rgba(107, 144, 128, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                              borderColor: isSelected ? 'var(--color-primary)' : 'var(--border-glass)',
                              color: isSelected ? 'var(--color-primary)' : 'var(--text-muted)',
                              padding: '6px 14px',
                              fontSize: '0.75rem',
                              fontWeight: '700',
                              border: '1px solid'
                            }}
                            onClick={() => {
                              setReprogramMonth(monthStr)
                              setShowAllReprogramDays(false)
                              const daysInMonth = Array.from(new Set(turnos.filter(t => t.estado === 'DISPONIBLE').map(t => t.fecha))).sort().filter(d => d.startsWith(monthStr))
                              if (daysInMonth.length > 0) {
                                setReprogramDate(daysInMonth[0])
                                setReprogramNewTurnoId('')
                              }
                            }}
                          >
                            {getMonthName(monthStr)}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Selector de Día (Grilla que se ajusta a lo ancho) */}
                  {reprogramMonth && (
                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '12px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Selecciona el Día:</span>
                      
                      {(() => {
                        const daysInMonth = Array.from(new Set(turnos.filter(t => t.estado === 'DISPONIBLE').map(t => t.fecha))).sort().filter(d => d.startsWith(reprogramMonth))
                        const displayedDays = showAllReprogramDays ? daysInMonth : daysInMonth.slice(0, 6)
                        
                        return (
                          <>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
                              {displayedDays.map(dateStr => {
                                const isSelected = reprogramDate === dateStr
                                const { dayName, dayNum } = formatDateLabel(dateStr)
                                return (
                                  <button
                                    key={dateStr}
                                    type="button"
                                    className="btn"
                                    style={{
                                      background: isSelected ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'rgba(255,255,255,0.02)',
                                      border: isSelected ? 'none' : '1px solid var(--border-glass)',
                                      color: isSelected ? 'var(--bg-obsidian-darker)' : 'var(--text-muted)',
                                      padding: '8px 12px',
                                      flexDirection: 'column',
                                      gap: '1px',
                                      width: '65px',
                                      height: '52px',
                                      flexShrink: 0
                                    }}
                                    onClick={() => {
                                      setReprogramDate(dateStr)
                                      setReprogramNewTurnoId('')
                                    }}
                                  >
                                    <span style={{ fontSize: '0.65rem', fontWeight: '800', color: isSelected ? 'var(--bg-obsidian-darker)' : 'var(--color-primary)', letterSpacing: '0.05em' }}>
                                      {dayName.toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: '1.1rem', fontWeight: '800', color: isSelected ? 'var(--bg-obsidian-darker)' : 'var(--text-main)' }}>
                                      {dayNum}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                            
                            {daysInMonth.length > 6 && (
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ padding: '6px 12px', fontSize: '0.75rem', marginTop: '6px', width: '100%' }}
                                onClick={() => setShowAllReprogramDays(!showAllReprogramDays)}
                              >
                                {showAllReprogramDays ? 'Ver Menos Días' : `Ver Más Días (+${daysInMonth.length - 6})`}
                              </button>
                            )}
                          </>
                        )
                      })()}
                    </div>
                  )}

                  {/* Horarios del Día Seleccionado (Compacto en 2 o más líneas a lo ancho) */}
                  {reprogramDate && (
                    <div style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>Selecciona la Hora:</span>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '8px' }}>
                        {turnos.filter(t => t.estado === 'DISPONIBLE' && t.fecha === reprogramDate).map(t => {
                          const isSelected = reprogramNewTurnoId === String(t.id)
                          return (
                            <button
                              key={t.id}
                              type="button"
                              className="btn"
                              style={{
                                background: isSelected ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'rgba(255,255,255,0.03)',
                                border: isSelected ? 'none' : '1px solid var(--border-glass)',
                                color: isSelected ? 'var(--bg-obsidian-darker)' : 'var(--text-main)',
                                padding: '8px 4px',
                                fontSize: '0.8rem',
                                fontWeight: '800',
                                textAlign: 'center'
                              }}
                              onClick={() => setReprogramNewTurnoId(String(t.id))}
                              disabled={submitting}
                            >
                              {t.hora.substring(0, 5)}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                </div>
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setIsReprogramModalOpen(false)
                  setReprogramNewTurnoId('')
                }} 
                disabled={submitting}
              >
                Cerrar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleReprogramConsulta(activeConsulta.id, Number(reprogramNewTurnoId))}
                disabled={submitting || !reprogramNewTurnoId}
              >
                Reprogramar
              </button>
            </div>
          </div>
        </div>
      )}

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        recipientName={contactRecipientName}
        recipientEmail={contactRecipientEmail}
        senderName={
          patients.find(p => p.email === user?.email)
            ? (patients.find(p => p.email === user?.email)?.nombre || 'Paciente')
            : user?.roles.includes('ROLE_ADMIN')
              ? 'Administrador VollMed'
              : 'Paciente VollMed'
        }
        senderEmail={user?.email || ''}
        defaultSubject="Consulta sobre mi atención médica - VollMed"
        hideEmail={true}
      />
    </>
  )
}
