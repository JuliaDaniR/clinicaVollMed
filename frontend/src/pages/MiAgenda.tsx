import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { 
  Calendar, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Clock, 
  AlertTriangle,
  RotateCcw,
  User,
  FileSpreadsheet,
  CalendarDays,
  X,
  Mail,
  AlertCircle,
  MoreVertical,
  ClipboardList
} from 'lucide-react'
import ContactModal from '../components/ContactModal'

interface Patient {
  id: number
  nombre: string
  email: string
}

interface ScheduleTemplate {
  id: number
  nombre?: string
  activa: boolean
  duracionTurno: number
  cantidadBloques: number
  medicoNombre: string
  dias?: {
    dia: string
    horaInicio: string
    horaFin: string
  }[]
}

interface DiaBlock {
  dia: string
  activo: boolean
  horaInicio: string
  horaFin: string
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

export default function MiAgenda() {
  const { user } = useAuthStore()
  const showToast = useToastStore(state => state.showToast)
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [medicoId, setMedicoId] = useState<number | null>(null)
  
  // Booked appointments list
  const [bookedList, setBookedList] = useState<BookedConsulta[]>([])
  
  const [activeConsulta, setActiveConsulta] = useState<BookedConsulta | null>(null)
  const [cancelReason, setCancelReason] = useState('MEDICO_CANCELO')
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isReprogramModalOpen, setIsReprogramModalOpen] = useState(false)
  const [reprogramNewDateTime, setReprogramNewDateTime] = useState('')
  const [patFilter, setPatFilter] = useState('')
  
  // Contact Modal and Patient state
  const [patients, setPatients] = useState<Patient[]>([])
  const [medicoNombre, setMedicoNombre] = useState<string>('')
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactRecipientName, setContactRecipientName] = useState('')
  const [contactRecipientEmail, setContactRecipientEmail] = useState('')

  // Dropdown States
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null)
  const [activeTempDropdownId, setActiveTempDropdownId] = useState<number | null>(null)
  const [expandedRanges, setExpandedRanges] = useState<string[]>([])

  const toggleRangeExpanded = (rangeId: string) => {
    setExpandedRanges(prev => 
      prev.includes(rangeId) ? prev.filter(id => id !== rangeId) : [...prev, rangeId]
    )
  }

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null)
      setActiveTempDropdownId(null)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

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

  const handleProposeReschedule = async (id: number, newDateTime: string) => {
    if (!newDateTime) {
      showToast('Por favor selecciona una fecha y hora', 'error')
      return
    }

    setSubmitting(true)
    try {
      const formattedIso = newDateTime.length === 16 ? `${newDateTime}:00` : newDateTime
      const response = await api.put(`/consultas/${id}/proponer-reprogramacion`, {
        fechaPropuesta: formattedIso
      })
      if (response.data.success) {
        showToast('Propuesta de reprogramación enviada al paciente', 'success')
        setIsReprogramModalOpen(false)
        setReprogramNewDateTime('')
        await fetchConsultas()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al proponer la reprogramación'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredAppointments = [...bookedList]
    .filter(item => item.idMedico === medicoId)
    .filter(item => patFilter ? item.pacienteNombre.toLowerCase().includes(patFilter.toLowerCase()) : true)
    .sort((a, b) => a.fecha.localeCompare(b.fecha))
  
  // Schedule templates list
  const [templates, setTemplates] = useState<ScheduleTemplate[]>([])
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('')

  // Create Template form state
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [duracion, setDuracion] = useState(30)
  const [nombrePlantilla, setNombrePlantilla] = useState('')

  // Custom Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {})

  const requestConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message)
    setConfirmAction(() => action)
    setIsConfirmOpen(true)
  }
  const [dias, setDias] = useState<DiaBlock[]>([
    { dia: 'LUNES', activo: true, horaInicio: '08:00', horaFin: '16:00' },
    { dia: 'MARTES', activo: true, horaInicio: '08:00', horaFin: '16:00' },
    { dia: 'MIERCOLES', activo: true, horaInicio: '08:00', horaFin: '16:00' },
    { dia: 'JUEVES', activo: true, horaInicio: '08:00', horaFin: '16:00' },
    { dia: 'VIERNES', activo: true, horaInicio: '08:00', horaFin: '16:00' },
    { dia: 'SABADO', activo: false, horaInicio: '08:00', horaFin: '12:00' },
    { dia: 'DOMINGO', activo: false, horaInicio: '08:00', horaFin: '12:00' },
  ])

  // Slot Regeneration manual triggers state
  const [regenDate, setRegenDate] = useState('')
  const [regenStart, setRegenStart] = useState('')
  const [regenEnd, setRegenEnd] = useState('')

  // Vacation / block range state
  const [blockStart, setBlockStart] = useState('')
  const [blockEnd, setBlockEnd] = useState('')

  // Blocked slots list
  const [blockedSlots, setBlockedSlots] = useState<any[]>([])

  const fetchBlockedSlots = async (mId: number) => {
    try {
      const res = await api.get(`/turnos/medico/${mId}/bloqueados`)
      if (res.data.status === 'success') {
        setBlockedSlots(res.data.data || [])
      }
    } catch (e) {
      console.error('Error fetching blocked slots', e)
    }
  }

  const fetchMedicoAndTemplates = async () => {
    setLoading(true)
    try {
      // 1. Find the current doctor record by email
      const docRes = await api.get('/medicos?page=0&size=100')
      const matched = docRes.data.data.content?.find((m: any) => m.email === user?.email)
      if (matched) {
        setMedicoId(matched.id)
        setMedicoNombre(matched.nombre)
        
        // 2. Fetch templates for this doctor
        const tempRes = await api.get(`/horarios/medico/${matched.id}`)
        if (tempRes.data.status === 'success') {
          setTemplates(tempRes.data.data || [])
          if (tempRes.data.data && tempRes.data.data.length > 0) {
            setSelectedTemplateId(String(tempRes.data.data[0].id))
          }
        }

        // Fetch blocked slots
        await fetchBlockedSlots(matched.id)
      } else {
        showToast('No se encontró perfil médico asociado a este usuario.', 'error')
      }
    } catch (e) {
      console.error(e)
      showToast('Error al cargar plantillas de horarios', 'error')
    }

    try {
      // 3. Fetch patients for email lookup
      const patRes = await api.get('/pacientes?page=0&size=100')
      if (patRes.data.success) {
        setPatients(patRes.data.data.content || [])
      }
    } catch (e) {
      console.error('Error loading patients list for lookup', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMedicoAndTemplates()
    fetchConsultas()
  }, [])

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!medicoId) return

    const activeBlocks = dias
      .filter(d => d.activo)
      .map(d => ({
        dia: d.dia,
        horaInicio: d.horaInicio,
        horaFin: d.horaFin
      }))

    if (activeBlocks.length === 0) {
      showToast('Por favor selecciona al menos un día laborable', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post('/horarios', {
        medicoId,
        nombre: nombrePlantilla || `Agenda ${duracion}m`,
        duracionPersonalizada: duracion,
        dias: activeBlocks
      })
      if (response.data.status === 'success') {
        showToast('Plantilla horaria creada correctamente y turnos generados', 'success')
        setIsFormOpen(false)
        setNombrePlantilla('')
        fetchMedicoAndTemplates()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al crear la plantilla'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteTemplate = (id: number) => {
    requestConfirmation(
      '¿Estás seguro de que deseas desactivar esta plantilla horaria? No se generarán más turnos basados en ella.',
      async () => {
        try {
          await api.delete(`/horarios/${id}`)
          showToast('Plantilla horaria desactivada', 'success')
          fetchMedicoAndTemplates()
        } catch (err: any) {
          console.error(err)
          showToast('Error al desactivar la plantilla', 'error')
        }
      }
    )
  }

  const handleRegenerateAll = async () => {
    if (!selectedTemplateId) {
      showToast('Selecciona una plantilla horaria primero', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post(`/horarios/${selectedTemplateId}/regenerar`)
      if (response.data.status === 'success') {
        showToast(`Turnos regenerados correctamente. Total: ${response.data.turnos_regenerados || 0}`, 'success')
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al regenerar los turnos', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegenerateDay = async () => {
    if (!selectedTemplateId) {
      showToast('Selecciona una plantilla horaria primero', 'error')
      return
    }
    if (!regenDate) {
      showToast('Selecciona una fecha', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post(`/horarios/${selectedTemplateId}/regenerar-dia?fecha=${regenDate}`)
      if (response.data.status === 'success') {
        showToast(`Día ${regenDate} regenerado correctamente. Turnos: ${response.data.turnos_regenerados || 0}`, 'success')
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al regenerar turnos del día', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRegenerateRange = async () => {
    if (!selectedTemplateId) {
      showToast('Selecciona una plantilla horaria primero', 'error')
      return
    }
    if (!regenStart || !regenEnd) {
      showToast('Selecciona las fechas de inicio y fin', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post(`/horarios/${selectedTemplateId}/regenerar-rango?inicio=${regenStart}&fin=${regenEnd}`)
      if (response.data.status === 'success') {
        showToast(`Rango regenerado. Turnos: ${response.data.turnos_regenerados || 0}`, 'success')
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al regenerar rango de turnos', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleBlockRange = async () => {
    if (!medicoId) return
    if (!blockStart || !blockEnd) {
      showToast('Selecciona el rango de fechas para el bloqueo', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post(`/turnos/medico/${medicoId}/bloquear?desde=${blockStart}&hasta=${blockEnd}`)
      if (response.data.status === 'success') {
        showToast('Turnos bloqueados correctamente en el rango seleccionado', 'success')
        setBlockStart('')
        setBlockEnd('')
        await fetchBlockedSlots(medicoId)
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al bloquear turnos', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnblockRange = async () => {
    if (!medicoId) return
    if (!blockStart || !blockEnd) {
      showToast('Selecciona el rango de fechas para el desbloqueo', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post(`/turnos/medico/${medicoId}/desbloquear?desde=${blockStart}&hasta=${blockEnd}`)
      if (response.data.status === 'success') {
        showToast('Turnos desbloqueados y liberados correctamente', 'success')
        setBlockStart('')
        setBlockEnd('')
        await fetchBlockedSlots(medicoId)
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al desbloquear turnos', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnblockSingleSlot = async (turnoId: number) => {
    if (!medicoId) return
    setSubmitting(true)
    try {
      const response = await api.post(`/turnos/${turnoId}/desbloquear`)
      if (response.data.status === 'success') {
        showToast('Turno liberado correctamente', 'success')
        await fetchBlockedSlots(medicoId)
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al liberar el turno'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleUnblockDate = async (dateStr: string) => {
    if (!medicoId) return
    setSubmitting(true)
    try {
      const response = await api.post(`/turnos/medico/${medicoId}/desbloquear?desde=${dateStr}&hasta=${dateStr}`)
      if (response.data.status === 'success') {
        showToast(`Día ${dateStr} liberado y turnos habilitados`, 'success')
        await fetchBlockedSlots(medicoId)
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al liberar el día', 'error')
    } finally {
      setSubmitting(false)
    }
  }
  const handleUnblockRangeSpecific = async (start: string, end: string) => {
    if (!medicoId) return
    setSubmitting(true)
    try {
      const response = await api.post(`/turnos/medico/${medicoId}/desbloquear?desde=${start}&hasta=${end}`)
      if (response.data.status === 'success') {
        showToast('Periodo de licencia liberado y turnos habilitados', 'success')
        await fetchBlockedSlots(medicoId)
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al liberar el periodo de licencia', 'error')
    } finally {
      setSubmitting(false)
    }
  }
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
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al cancelar la consulta'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const toggleDayActivo = (index: number) => {
    const updated = [...dias]
    updated[index].activo = !updated[index].activo
    setDias(updated)
  }

  const updateDayTime = (index: number, field: 'horaInicio' | 'horaFin', val: string) => {
    const updated = [...dias]
    updated[index][field] = val
    setDias(updated)
  }

  // Group blockedSlots by date for the active licenses list
  const blockedByDate = blockedSlots.reduce((acc: { [key: string]: any[] }, slot) => {
    const d = slot.fecha
    if (!acc[d]) acc[d] = []
    acc[d].push(slot)
    return acc
  }, {})



  // Get consecutive ranges of blocked dates
  const uniqueBlockedDates = Array.from(new Set(blockedSlots.map(s => s.fecha))).sort()

  interface BlockedRange {
    start: string
    end: string
    dates: string[]
  }

  const getConsecutiveRanges = (dates: string[]): BlockedRange[] => {
    if (dates.length === 0) return []
    const ranges: BlockedRange[] = []
    let currentRange: string[] = [dates[0]]

    for (let i = 1; i < dates.length; i++) {
      const prevDate = new Date(dates[i - 1] + 'T00:00:00')
      const currDate = new Date(dates[i] + 'T00:00:00')
      const diffTime = Math.abs(currDate.getTime() - prevDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays === 1) {
        currentRange.push(dates[i])
      } else {
        ranges.push({
          start: currentRange[0],
          end: currentRange[currentRange.length - 1],
          dates: currentRange
        })
        currentRange = [dates[i]]
      }
    }

    ranges.push({
      start: currentRange[0],
      end: currentRange[currentRange.length - 1],
      dates: currentRange
    })

    return ranges
  }

  const formatRangeLabel = (start: string, end: string) => {
    const format = (dateStr: string) => {
      const parts = dateStr.split('-')
      return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr
    }
    if (start === end) {
      return `Día único: ${format(start)}`
    }
    return `Licencia: Del ${format(start)} al ${format(end)}`
  }

  return (
    <>
      <div className="header-actions">
        <div>
          <h1 className="page-title">Mi Agenda de Consultas</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Gestiona tu disponibilidad horaria, configura plantillas y administra licencias o vacaciones.
          </p>
        </div>
        {!isFormOpen && (
          <button className="btn btn-primary" onClick={() => setIsFormOpen(true)}>
            <Plus size={18} />
            <span>Configurar Horarios</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="glass-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Cargando agenda...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Sección de Citas Programadas */}
          <div className="glass-card" style={{ padding: '30px', position: 'relative', zIndex: activeDropdownId !== null ? 10 : 1 }}>
            <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileSpreadsheet className="text-primary" size={22} />
              Mis Citas Programadas
            </h2>

            <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', alignItems: 'center' }}>
              <div className="form-group" style={{ margin: 0, flexGrow: 1 }}>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="🔍 Buscar por nombre del paciente..."
                  value={patFilter}
                  onChange={e => setPatFilter(e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {filteredAppointments.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                No tienes citas programadas asociadas en este momento o ninguna coincide con el filtro.
              </p>
            ) : (
              <div className="table-container">
                <table className="table-glass">
                  <thead>
                    <tr>
                      <th>Paciente</th>
                      <th>Fecha y Hora</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map(item => (
                      <tr 
                        key={item.id}
                        style={{
                          opacity: item.cancelada ? 0.6 : 1,
                          background: item.cancelada ? 'rgba(239, 68, 68, 0.02)' : 'transparent'
                        }}
                      >
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <User size={14} className="text-secondary" />
                              <span style={{ fontWeight: '600' }}>{item.pacienteNombre}</span>
                            </div>
                            {patients.find(p => p.id === item.idPaciente)?.email && (
                              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '22px' }}>
                                {patients.find(p => p.id === item.idPaciente)?.email}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CalendarDays size={14} className="text-secondary" />
                            <span>{formatFriendlyDate(item.fecha)}</span>
                          </div>
                        </td>
                        <td style={{ whiteSpace: 'nowrap' }}>
                          {item.cancelada ? (
                            <span className="badge badge-danger" title={`Motivo: ${item.motivoCancelamiento || 'Desconocido'}`}>
                              Cancelada
                            </span>
                          ) : item.reprogramadaPendiente ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <span className="badge badge-success" style={{ width: 'fit-content' }}>Activa</span>
                              <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '4px 8px', whiteSpace: 'nowrap', width: 'fit-content' }}>
                                Cambio propuesto: {formatFriendlyDate(item.fechaPropuesta || '')}
                              </span>
                            </div>
                          ) : (
                            <span className="badge badge-success">Activa</span>
                          )}
                        </td>
                        <td style={{ position: 'relative', zIndex: activeDropdownId === item.id ? 50 : 'auto' }}>
                          <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ 
                              padding: '6px', 
                              borderRadius: '50%', 
                              width: '32px', 
                              height: '32px', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center' 
                            }}
                            onClick={(e) => {
                              e.stopPropagation()
                              setActiveDropdownId(activeDropdownId === item.id ? null : item.id)
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeDropdownId === item.id && (
                            <div 
                              style={{
                                position: 'absolute',
                                right: '16px',
                                top: '45px',
                                background: 'rgba(15, 23, 42, 0.95)',
                                backdropFilter: 'blur(12px)',
                                border: '1px solid var(--border-glass-hover)',
                                borderRadius: 'var(--radius-md)',
                                padding: '6px',
                                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), var(--shadow-glow)',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px',
                                zIndex: 100,
                                minWidth: '150px'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                type="button"
                                className="btn"
                                style={{ 
                                  padding: '8px 12px', 
                                  fontSize: '0.8rem', 
                                  justifyContent: 'flex-start', 
                                  border: 'none',
                                  background: 'transparent',
                                  width: '100%',
                                  color: 'var(--text-main)',
                                  gap: '10px'
                                }}
                                onClick={() => {
                                  setActiveDropdownId(null)
                                  navigate('/historia-clinica', { state: { patientId: item.idPaciente } })
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <ClipboardList size={14} style={{ color: 'var(--color-primary)' }} />
                                <span>Historia Clínica</span>
                              </button>

                              <button
                                type="button"
                                className="btn"
                                style={{ 
                                  padding: '8px 12px', 
                                  fontSize: '0.8rem', 
                                  justifyContent: 'flex-start', 
                                  border: 'none',
                                  background: 'transparent',
                                  width: '100%',
                                  color: 'var(--text-main)',
                                  gap: '10px'
                                }}
                                onClick={() => {
                                  setActiveDropdownId(null)
                                  const patEmail = patients.find(p => p.id === item.idPaciente)?.email || 'paciente@vollmed.com'
                                  setContactRecipientName(item.pacienteNombre)
                                  setContactRecipientEmail(patEmail)
                                  setIsContactOpen(true)
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <Mail size={14} style={{ color: 'var(--color-secondary)' }} />
                                <span>Contactar</span>
                              </button>

                              {!item.cancelada && !item.reprogramadaPendiente && (
                                <button
                                  type="button"
                                  className="btn"
                                  style={{ 
                                    padding: '8px 12px', 
                                    fontSize: '0.8rem', 
                                    justifyContent: 'flex-start', 
                                    border: 'none',
                                    background: 'transparent',
                                    width: '100%',
                                    color: 'var(--text-main)',
                                    gap: '10px'
                                  }}
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    setActiveConsulta(item)
                                    setIsReprogramModalOpen(true)
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <Clock size={14} style={{ color: 'var(--color-secondary)' }} />
                                  <span>Reprogramar</span>
                                </button>
                              )}

                              {!item.cancelada && (
                                <button
                                  type="button"
                                  className="btn"
                                  style={{ 
                                    padding: '8px 12px', 
                                    fontSize: '0.8rem', 
                                    justifyContent: 'flex-start', 
                                    border: 'none',
                                    background: 'transparent',
                                    width: '100%',
                                    color: 'var(--color-danger)',
                                    gap: '10px'
                                  }}
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    setActiveConsulta(item)
                                    setIsCancelModalOpen(true)
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  <Trash2 size={14} />
                                  <span>Cancelar</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          {/* Formulario de creación de plantilla */}
          {isFormOpen && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Clock className="text-primary" size={22} />
                Nueva Disponibilidad Semanal
              </h2>

              <form onSubmit={handleCreateTemplate}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="agenda-nombre">Nombre identificador de la agenda</label>
                    <input
                      id="agenda-nombre"
                      type="text"
                      className="input-glass"
                      placeholder="ej. Turno Mañana, Consultorio Lomas, Guardia Sábado"
                      value={nombrePlantilla}
                      onChange={e => setNombrePlantilla(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group" style={{ margin: 0 }}>
                    <label htmlFor="agenda-duracion">Duración de la consulta (minutos)</label>
                    <input
                      id="agenda-duracion"
                      type="number"
                      min="10"
                      max="120"
                      className="input-glass"
                      value={duracion}
                      onChange={e => setDuracion(Number(e.target.value))}
                      disabled={submitting}
                    />
                  </div>
                </div>

                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginTop: '24px', marginBottom: '16px' }}>Horario por Día</h3>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {dias.map((d, index) => (
                    <div 
                      key={d.dia} 
                      style={{ 
                        display: 'grid', 
                        gridTemplateColumns: '150px 100px 1fr 1fr', 
                        alignItems: 'center',
                        gap: '20px',
                        background: d.activo ? 'rgba(255,255,255,0.01)' : 'transparent',
                        padding: '10px 16px',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid',
                        borderColor: d.activo ? 'var(--border-glass)' : 'transparent'
                      }}
                    >
                      <span style={{ fontWeight: '600', color: d.activo ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {d.dia}
                      </span>
                      
                      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                        <input 
                          type="checkbox" 
                          checked={d.activo} 
                          onChange={() => toggleDayActivo(index)}
                          style={{ accentColor: 'var(--color-primary)' }}
                          disabled={submitting}
                        />
                        <span style={{ fontSize: '0.85rem' }}>Trabaja</span>
                      </label>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Hora Entrada</label>
                        <input 
                          type="time" 
                          className="input-glass"
                          style={{ padding: '6px 12px' }}
                          value={d.horaInicio}
                          onChange={e => updateDayTime(index, 'horaInicio', e.target.value)}
                          disabled={!d.activo || submitting}
                        />
                      </div>

                      <div className="form-group" style={{ margin: 0 }}>
                        <label style={{ fontSize: '0.75rem' }}>Hora Salida</label>
                        <input 
                          type="time" 
                          className="input-glass"
                          style={{ padding: '6px 12px' }}
                          value={d.horaFin}
                          onChange={e => updateDayTime(index, 'horaFin', e.target.value)}
                          disabled={!d.activo || submitting}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)} disabled={submitting}>
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    <Plus size={18} />
                    <span>{submitting ? 'Generando turnos...' : 'Crear Disponibilidad'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Plantillas creadas */}
          <div className="glass-card" style={{ padding: '30px', position: 'relative', zIndex: activeTempDropdownId !== null ? 10 : 1 }}>
            <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Calendar className="text-primary" size={22} />
              Plantillas de Disponibilidad Semanal
            </h2>

            {templates.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                Aún no has configurado ninguna plantilla semanal de turnos. Usa el botón superior para crear una.
              </p>
            ) : (
              <div className="table-container">
                <table className="table-glass">
                  <thead>
                    <tr>
                      <th>Nombre / Duración</th>
                      <th>Días Laborables</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map(t => (
                      <tr key={t.id}>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {t.nombre || `Plantilla #${t.id}`}
                            </span>
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              Citas de {t.duracionTurno} min
                            </span>
                          </div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            <span style={{ fontWeight: '500', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                              {t.cantidadBloques} bloques configurados
                            </span>
                            {t.dias && t.dias.length > 0 && (
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', 
                                gap: '6px', 
                                marginTop: '4px',
                                background: 'rgba(255, 255, 255, 0.02)',
                                padding: '8px',
                                borderRadius: 'var(--radius-sm)',
                                border: '1px solid rgba(255, 255, 255, 0.05)'
                              }}>
                                {t.dias.map((d, index) => (
                                  <div key={index} style={{ 
                                    fontSize: '0.72rem', 
                                    display: 'flex', 
                                    flexDirection: 'column', 
                                    padding: '4px 6px', 
                                    background: 'rgba(255, 255, 255, 0.03)', 
                                    borderRadius: '4px', 
                                    borderLeft: '3px solid var(--color-primary)' 
                                  }}>
                                    <span style={{ fontWeight: '600', color: 'var(--color-primary)', textTransform: 'capitalize' }}>
                                      {d.dia.toLowerCase()}
                                    </span>
                                    <span style={{ color: 'var(--text-muted)' }}>
                                      {d.horaInicio.substring(0, 5)} - {d.horaFin.substring(0, 5)} hs
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${t.activa ? 'badge-success' : 'badge-danger'}`}>
                            {t.activa ? 'Activa' : 'Inactiva'}
                          </span>
                        </td>
                        <td style={{ position: 'relative', zIndex: activeTempDropdownId === t.id ? 50 : 'auto' }}>
                          {t.activa && (
                            <>
                              <button
                                type="button"
                                className="btn btn-secondary"
                                style={{ 
                                  padding: '6px', 
                                  borderRadius: '50%', 
                                  width: '32px', 
                                  height: '32px', 
                                  display: 'inline-flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'center' 
                                }}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setActiveTempDropdownId(activeTempDropdownId === t.id ? null : t.id)
                                }}
                              >
                                <MoreVertical size={16} />
                              </button>

                              {activeTempDropdownId === t.id && (
                                <div 
                                  style={{
                                    position: 'absolute',
                                    right: '16px',
                                    top: '45px',
                                    background: 'rgba(15, 23, 42, 0.95)',
                                    backdropFilter: 'blur(12px)',
                                    border: '1px solid var(--border-glass-hover)',
                                    borderRadius: 'var(--radius-md)',
                                    padding: '6px',
                                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5), var(--shadow-glow)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '4px',
                                    zIndex: 100,
                                    minWidth: '130px'
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    className="btn"
                                    style={{ 
                                      padding: '8px 12px', 
                                      fontSize: '0.8rem', 
                                      justifyContent: 'flex-start', 
                                      border: 'none',
                                      background: 'transparent',
                                      width: '100%',
                                      color: 'var(--color-danger)',
                                      gap: '10px'
                                    }}
                                    onClick={() => {
                                      setActiveTempDropdownId(null)
                                      handleDeleteTemplate(t.id)
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                  >
                                    <Trash2 size={14} />
                                    <span>Desactivar</span>
                                  </button>
                                </div>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
            
            {/* Controles de Regeneración */}
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RefreshCw className="text-secondary" size={22} />
                Regenerar Turnos Manualmente
              </h2>

              <div style={{
                background: 'rgba(6, 182, 212, 0.05)',
                border: '1px solid rgba(6, 182, 212, 0.2)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginBottom: '20px',
                fontSize: '0.82rem',
                lineHeight: '1.45',
                color: 'var(--text-muted)'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', color: 'var(--color-primary)' }}>
                  <AlertCircle size={18} />
                  <strong style={{ fontWeight: '600' }}>¿Cómo funciona la regeneración?</strong>
                </div>
                <p style={{ margin: 0 }}>
                  Esta acción lee la disponibilidad de la plantilla y crea los turnos vacíos en el calendario para que los pacientes puedan reservarlos.
                </p>
                <p style={{ margin: '6px 0 0 0', color: 'rgba(16, 185, 129, 0.95)', fontWeight: '500' }}>
                  🔒 <strong>Citas protegidas:</strong> Los turnos que ya se encuentran reservados por pacientes <strong>nunca</strong> se verán afectados ni modificados.
                </p>
              </div>

              <div className="form-group">
                <label htmlFor="regen-select">Selecciona la plantilla activa</label>
                <select
                  id="regen-select"
                  className="input-glass"
                  value={selectedTemplateId}
                  onChange={e => setSelectedTemplateId(e.target.value)}
                  style={{ background: 'var(--bg-obsidian-darker)', width: '100%' }}
                  disabled={submitting}
                >
                  <option value="">-- Selecciona --</option>
                  {templates.filter(t => t.activa).map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre || `Plantilla #${t.id}`} ({t.duracionTurno} min)
                    </option>
                  ))}
                </select>
              </div>

              {/* Boton Regenerar Todo */}
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ width: '100%', marginBottom: '24px', gap: '10px' }}
                onClick={handleRegenerateAll}
                disabled={submitting || !selectedTemplateId}
              >
                <RotateCcw size={16} />
                <span>Regenerar Toda la Agenda Futura</span>
              </button>

              {/* Regenerar por Dia */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '20px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '14px' }}>Regenerar Día Único</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ margin: 0, flexGrow: 1 }}>
                    <label>Fecha</label>
                    <input 
                      type="date" 
                      className="input-glass"
                      value={regenDate}
                      onChange={e => setRegenDate(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleRegenerateDay}
                    disabled={submitting || !selectedTemplateId || !regenDate}
                  >
                    <span>Regenerar Día</span>
                  </button>
                </div>
              </div>

              {/* Regenerar por Rango */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '20px', marginTop: '20px' }}>
                <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '14px' }}>Regenerar por Rango</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Desde</label>
                    <input 
                      type="date" 
                      className="input-glass"
                      value={regenStart}
                      onChange={e => setRegenStart(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label>Hasta</label>
                    <input 
                      type="date" 
                      className="input-glass"
                      value={regenEnd}
                      onChange={e => setRegenEnd(e.target.value)}
                      disabled={submitting}
                    />
                  </div>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '16px' }}
                  onClick={handleRegenerateRange}
                  disabled={submitting || !selectedTemplateId || !regenStart || !regenEnd}
                >
                  <span>Regenerar Rango de Fechas</span>
                </button>
              </div>

            </div>

            {/* Licencias y Bloqueos de Citas */}
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertTriangle className="text-secondary" size={22} />
                Licencias y Vacaciones
              </h2>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Bloquea los turnos disponibles de tu agenda para períodos en los que no estarás activo. Los turnos que ya se encuentren reservados no serán modificados por el bloqueo.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Fecha de Inicio</label>
                  <input 
                    type="date" 
                    className="input-glass"
                    value={blockStart}
                    onChange={e => setBlockStart(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="form-group" style={{ margin: 0 }}>
                  <label>Fecha de Fin</label>
                  <input 
                    type="date" 
                    className="input-glass"
                    value={blockEnd}
                    onChange={e => setBlockEnd(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-primary" 
                  style={{ background: 'linear-gradient(135deg, var(--color-warning), var(--color-danger))', boxShadow: 'none', color: 'white' }}
                  onClick={handleBlockRange}
                  disabled={submitting || !blockStart || !blockEnd}
                >
                  <span>Bloquear Agenda en Rango</span>
                </button>

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleUnblockRange}
                  disabled={submitting || !blockStart || !blockEnd}
                >
                  <span>Desbloquear y Liberar Rango</span>
                </button>
              </div>

              {/* Listado de Bloqueos Activos */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '24px', marginTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <CalendarDays size={18} className="text-secondary" style={{ color: 'var(--color-warning)' }} />
                  Periodos Bloqueados Activos
                </h3>

                {uniqueBlockedDates.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontStyle: 'italic', margin: 0 }}>
                    No tienes periodos ni turnos bloqueados actualmente.
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {getConsecutiveRanges(uniqueBlockedDates).map(range => {
                      const rangeId = `${range.start}_${range.end}`
                      const isExpanded = expandedRanges.includes(rangeId)
                      const totalDays = range.dates.length
                      const label = formatRangeLabel(range.start, range.end)
                      
                      return (
                        <div key={rangeId} style={{ 
                          background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid rgba(255,255,255,0.05)', 
                          borderRadius: 'var(--radius-md)', 
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: '600', color: 'var(--color-primary)', fontSize: '0.9rem' }}>
                                📅 {label}
                              </span>
                              {totalDays > 1 && (
                                <span className="badge badge-success" style={{ background: 'rgba(107, 144, 128, 0.15)', color: 'var(--color-primary)', border: '1px solid rgba(107, 144, 128, 0.3)', textTransform: 'none', fontSize: '0.7rem', padding: '2px 8px' }}>
                                  {totalDays} días
                                </span>
                              )}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'auto' }}
                                onClick={() => toggleRangeExpanded(rangeId)}
                              >
                                {isExpanded ? 'Ocultar Detalle' : `Ver Detalle (${totalDays}d)`}
                              </button>
                              
                              <button 
                                type="button" 
                                className="btn btn-secondary" 
                                style={{ padding: '6px 12px', fontSize: '0.75rem', height: 'auto', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.2)' }}
                                onClick={() => handleUnblockRangeSpecific(range.start, range.end)}
                                disabled={submitting}
                              >
                                {totalDays > 1 ? 'Liberar Rango' : 'Liberar Día'}
                              </button>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div style={{ 
                              borderTop: '1px dashed var(--border-glass)', 
                              paddingTop: '12px',
                              marginTop: '4px',
                              maxHeight: '300px',
                              overflowY: 'auto',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '12px',
                              paddingRight: '6px'
                            }}>
                              {range.dates.map(dateStr => {
                                const slots = blockedByDate[dateStr] || []
                                const dateParts = dateStr.split('-')
                                const formattedDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : dateStr
                                
                                return (
                                  <div key={dateStr} style={{ 
                                    background: 'rgba(255,255,255,0.01)',
                                    border: '1px solid rgba(255,255,255,0.03)',
                                    borderRadius: 'var(--radius-sm)',
                                    padding: '10px 12px'
                                  }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                      <span style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '0.85rem' }}>
                                        {formattedDate}
                                      </span>
                                      <button 
                                        type="button" 
                                        className="btn btn-secondary" 
                                        style={{ padding: '3px 8px', fontSize: '0.7rem', height: 'auto', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--color-danger)', border: '1px solid rgba(239, 68, 68, 0.1)' }}
                                        onClick={() => handleUnblockDate(dateStr)}
                                        disabled={submitting}
                                      >
                                        Liberar Día
                                      </button>
                                    </div>
                                    
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                      {[...slots].sort((a,b) => a.hora.localeCompare(b.hora)).map(slot => (
                                        <div key={slot.id} style={{ 
                                          display: 'inline-flex', 
                                          alignItems: 'center', 
                                          gap: '6px', 
                                          background: 'rgba(239, 68, 68, 0.05)', 
                                          border: '1px solid rgba(239, 68, 68, 0.15)', 
                                          borderRadius: '4px', 
                                          padding: '3px 8px',
                                          fontSize: '0.75rem',
                                          color: 'var(--color-danger)'
                                        }}>
                                          <span>{slot.hora.substring(0, 5)} hs</span>
                                          <button 
                                            type="button" 
                                            style={{ 
                                              background: 'none', 
                                              border: 'none', 
                                              color: 'var(--text-muted)', 
                                              cursor: 'pointer', 
                                              padding: 0,
                                              display: 'inline-flex',
                                              alignItems: 'center'
                                            }}
                                            onClick={() => handleUnblockSingleSlot(slot.id)}
                                            disabled={submitting}
                                            title="Liberar este turno"
                                          >
                                            <X size={10} style={{ strokeWidth: 3 }} />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CANCELACIÓN DE CITA */}
      {isCancelModalOpen && activeConsulta && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Cancelar Consulta #{activeConsulta.id}</h2>
              <button className="close-btn" onClick={() => setIsCancelModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              ¿Deseas cancelar la cita para el paciente {activeConsulta.pacienteNombre}?
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

      {/* MODAL: PROPUESTA DE REPROGRAMACIÓN POR EL MÉDICO */}
      {isReprogramModalOpen && activeConsulta && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Proponer Reprogramación</h2>
              <button className="close-btn" onClick={() => setIsReprogramModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              Elige un nuevo día y horario para proponer al paciente {activeConsulta.pacienteNombre}.
              La cita actual seguirá agendada en {activeConsulta.fecha} hasta que el paciente acepte la propuesta.
            </p>

            <div className="form-group">
              <label htmlFor="reprogram-datetime">Nueva Fecha y Hora Propuesta</label>
              <input
                id="reprogram-datetime"
                type="datetime-local"
                className="input-glass"
                value={reprogramNewDateTime}
                onChange={e => setReprogramNewDateTime(e.target.value)}
                style={{ width: '100%', colorScheme: 'dark' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setIsReprogramModalOpen(false)}>
                Cerrar
              </button>
              <button 
                className="btn btn-primary" 
                onClick={() => handleProposeReschedule(activeConsulta.id, reprogramNewDateTime)}
              >
                Proponer Horario
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
        senderName={medicoNombre ? `Dr. ${medicoNombre}` : 'Médico VollMed'}
        senderEmail={user?.email || ''}
        defaultSubject="Consulta sobre tu cita médica - VollMed"
      />

      {/* Custom Confirmation Modal */}
      {isConfirmOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertCircle size={48} className="text-warning" style={{ color: 'var(--color-danger)' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontFamily: 'var(--font-title)' }}>
              Confirmar Acción
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
              {confirmMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsConfirmOpen(false)}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => {
                  setIsConfirmOpen(false)
                  confirmAction()
                }}
                style={{ flex: 1 }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
