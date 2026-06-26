import React, { useEffect, useState, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { 
  ClipboardList, 
  Plus, 
  FileText, 
  Search, 
  User, 
  Calendar,
  Sparkles,
  Printer,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface Patient {
  id: number
  nombre: string
  email: string
  dni?: string | null
  parentesco?: string | null
}

interface ClinicNote {
  id: number
  medicoId: number
  fecha: string
  contenido: string
}

interface Recipe {
  id: number
  idMedico: number
  idPaciente: number
  idConsulta?: number | null
  fecha: string
  indicaciones: string
}

const containsHTML = (str: string) => {
  if (!str) return false
  return /<[a-z][\s\S]*>/i.test(str)
}

export default function HistoriaClinicaPage() {
  const { user } = useAuthStore()
  const showToast = useToastStore(state => state.showToast)
  const location = useLocation()
  
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingHistory, setLoadingHistory] = useState(false)

  const selectedPatient = patients.find(p => String(p.id) === selectedPatientId)
  const filteredPatients = patients.filter(p => {
    const term = searchTerm.toLowerCase().trim()
    if (!term) return false
    const nameMatch = p.nombre.toLowerCase().includes(term)
    const dniMatch = p.dni ? p.dni.toLowerCase().includes(term) : false
    return nameMatch || dniMatch
  })
  
  // History data
  const [notes, setNotes] = useState<ClinicNote[]>([])
  const [historiaId, setHistoriaId] = useState<number | null>(null)
  
  // Forms state
  const [newNoteContent, setNewNoteContent] = useState('')
  const [newRecipeIndications, setNewRecipeIndications] = useState('')
  const [noteFocused, setNoteFocused] = useState(false)
  const [recipeFocused, setRecipeFocused] = useState(false)

  const noteTextareaRef = useRef<HTMLTextAreaElement>(null)
  const recipeTextareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-expand Evolution Note textarea
  useEffect(() => {
    const el = noteTextareaRef.current
    if (el) {
      el.style.height = 'auto'
      const baseHeight = noteFocused || newNoteContent ? 320 : 120
      el.style.height = `${Math.max(baseHeight, el.scrollHeight)}px`
    }
  }, [newNoteContent, noteFocused])

  // Auto-expand Recipe Indications textarea
  useEffect(() => {
    const el = recipeTextareaRef.current
    if (el) {
      el.style.height = 'auto'
      const baseHeight = recipeFocused || newRecipeIndications ? 250 : 100
      el.style.height = `${Math.max(baseHeight, el.scrollHeight)}px`
    }
  }, [newRecipeIndications, recipeFocused])
  
  // Search Recipe
  const [searchRecipeId, setSearchRecipeId] = useState('')
  const [searchedRecipe, setSearchedRecipe] = useState<Recipe | null>(null)
  const [loadingRecipe, setLoadingRecipe] = useState(false)
  
  const [submitting, setSubmitting] = useState(false)
  const [loadingAINote, setLoadingAINote] = useState(false)
  const [loadingAIRecipe, setLoadingAIRecipe] = useState(false)
  const [aiUnavailableNote, setAiUnavailableNote] = useState(false)
  const [aiUnavailableRecipe, setAiUnavailableRecipe] = useState(false)
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({})

  const toggleNote = (noteId: number, currentIndex: number, totalNotes: number) => {
    setExpandedNotes(prev => {
      const currentVal = prev[noteId] ?? (currentIndex === totalNotes - 1);
      return {
        ...prev,
        [noteId]: !currentVal
      };
    });
  }

  const handleAISuggestNote = async () => {
    if (!newNoteContent.trim()) return
    setLoadingAINote(true)
    setAiUnavailableNote(false)
    try {
      const response = await api.post('/ia/asistir-nota', { texto: newNoteContent })
      if (response.data.success) {
        setNewNoteContent(response.data.textoAsistido)
        if (response.data.iaDisponible === false) {
          setAiUnavailableNote(true)
          showToast('IA no disponible. Se generó plantilla clínica local editable.', 'success')
        } else {
          showToast('Nota de evolución estructurada por la IA', 'success')
        }
      } else {
        showToast('El asistente de IA no está disponible en este momento.', 'error')
      }
    } catch (err: any) {
      console.error(err)
      showToast('El asistente de IA no está disponible en este momento.', 'error')
    } finally {
      setLoadingAINote(false)
    }
  }

  const handleAISuggestRecipe = async () => {
    if (!newRecipeIndications.trim()) return
    setLoadingAIRecipe(true)
    setAiUnavailableRecipe(false)
    try {
      const response = await api.post('/ia/asistir-receta', { texto: newRecipeIndications })
      if (response.data.success) {
        setNewRecipeIndications(response.data.textoAsistido)
        if (response.data.iaDisponible === false) {
          setAiUnavailableRecipe(true)
          showToast('IA no disponible. Se generó plantilla clínica local editable.', 'success')
        } else {
          showToast('Receta optimizada por el asistente de IA', 'success')
        }
      } else {
        showToast('El asistente de IA no está disponible en este momento.', 'error')
      }
    } catch (err: any) {
      console.error(err)
      showToast('El asistente de IA no está disponible en este momento.', 'error')
    } finally {
      setLoadingAIRecipe(false)
    }
  }

  const isMedico = user?.roles.includes('ROLE_MEDICO')
  const isPaciente = user?.roles.includes('ROLE_PACIENTE')

  // Fetch patients if doctor/admin
  const fetchPatients = async () => {
    if (isPaciente) return
    setLoadingPatients(true)
    try {
      const res = await api.get('/pacientes?page=0&size=100')
      if (res.data.success) {
        setPatients(res.data.data.content || [])
      }
    } catch (e) {
      console.error(e)
      showToast('Error al cargar la lista de pacientes', 'error')
    } finally {
      setLoadingPatients(false)
    }
  }

  // Fetch own patient record if Patient role
  const fetchOwnPatientRecord = async () => {
    if (!isPaciente) return
    setLoadingHistory(true)
    try {
      const res = await api.get('/pacientes?page=0&size=100')
      const matched = res.data.data.content?.find((p: any) => p.email === user?.email)
      if (matched) {
        setSelectedPatientId(String(matched.id))
      } else {
        showToast('No se encontró expediente de paciente para tu usuario.', 'error')
      }
    } catch (e) {
      console.error(e)
      showToast('Error al buscar tu registro de paciente', 'error')
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    fetchPatients()
    fetchOwnPatientRecord()
    if (location.state?.patientId) {
      setSelectedPatientId(String(location.state.patientId))
    }
  }, [location.state])

  // Load patient clinical history
  const loadHistory = async (pacienteId: string) => {
    if (!pacienteId) {
      setNotes([])
      setHistoriaId(null)
      return
    }
    setLoadingHistory(true)
    try {
      const res = await api.get(`/historia-clinica/${pacienteId}`)
      if (res.data.success && res.data.data) {
        setNotes(res.data.data.notas || [])
        setHistoriaId(res.data.data.historiaId || null)
      } else {
        setNotes([])
        setHistoriaId(null)
      }
    } catch (err: any) {
      console.error(err)
      // The API returns a 400/404 if no history exists yet
      setNotes([])
      setHistoriaId(null)
      if (err.response?.status !== 400 && err.response?.status !== 404) {
        showToast('Error al cargar la historia clínica', 'error')
      }
    } finally {
      setLoadingHistory(false)
    }
  }

  useEffect(() => {
    if (selectedPatientId) {
      loadHistory(selectedPatientId)
    }
    setAiUnavailableNote(false)
    setAiUnavailableRecipe(false)
    setExpandedNotes({})
  }, [selectedPatientId])

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatientId || !newNoteContent) {
      showToast('Por favor escribe el contenido de la nota', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post('/historia-clinica/nota', {
        pacienteId: Number(selectedPatientId),
        medicoId: Number(user?.id),
        contenido: newNoteContent
      })
      if (response.data.success) {
        showToast('Nota clínica agregada al expediente', 'success')
        setNewNoteContent('')
        setAiUnavailableNote(false)
        loadHistory(selectedPatientId)
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al agregar nota'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateRecipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatientId || !newRecipeIndications) {
      showToast('Por favor escribe las indicaciones de la receta', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.post('/recetas', {
        idPaciente: Number(selectedPatientId),
        indicaciones: newRecipeIndications
      })
      if (response.data.success) {
        const createdRecipe = response.data.data
        showToast('Receta emitida con éxito', 'success')
        setNewRecipeIndications('')
        setAiUnavailableRecipe(false)
        // Auto set as searched recipe to view it
        setSearchedRecipe(createdRecipe)
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al emitir la receta'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

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
          <h1 className="page-title">Historia Clínica</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Expediente clínico electrónico de pacientes, registros de evolución y recetas médicas.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '30px', alignItems: 'start' }}>
        
        {/* Lado Izquierdo: Expediente */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          <div className="glass-card" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ClipboardList className="text-primary" size={22} />
              Expediente Clínico
            </h2>

            {/* Selector de Paciente (Buscador DNI/Nombre o Tarjeta del Seleccionado) */}
            {!isPaciente && (
              <div style={{ marginBottom: '24px' }}>
                {!selectedPatientId ? (
                  <div className="form-group" style={{ position: 'relative', marginBottom: 0 }}>
                    <label htmlFor="hc-paciente-search">Buscar Paciente (DNI o Nombre)</label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="hc-paciente-search"
                        type="text"
                        className="input-glass"
                        placeholder="Escriba el DNI o nombre del paciente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        style={{ width: '100%', paddingLeft: '40px' }}
                        disabled={loadingPatients}
                      />
                      <Search 
                        size={18} 
                        style={{ 
                          position: 'absolute', 
                          left: '14px', 
                          top: '50%', 
                          transform: 'translateY(-50%)', 
                          color: 'var(--text-muted)' 
                        }} 
                      />
                    </div>

                    {/* Lista flotante de resultados de búsqueda */}
                    {searchTerm.trim() !== '' && (
                      <div 
                        className="glass-card" 
                        style={{ 
                          position: 'absolute', 
                          top: '100%', 
                          left: 0, 
                          right: 0, 
                          zIndex: 100, 
                          marginTop: '8px', 
                          maxHeight: '250px', 
                          overflowY: 'auto', 
                          padding: '8px', 
                          background: 'var(--bg-obsidian-darker, #0d0f12)', 
                          backdropFilter: 'blur(10px)',
                          border: '1px solid var(--border-glass)',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }}
                      >
                        {filteredPatients.length === 0 ? (
                          <div style={{ padding: '12px', color: 'var(--text-muted)', textAlign: 'center', fontSize: '0.9rem' }}>
                            No se encontraron pacientes
                          </div>
                        ) : (
                          filteredPatients.map(p => (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedPatientId(String(p.id))
                                setSearchTerm('')
                              }}
                              style={{
                                padding: '10px 14px',
                                cursor: 'pointer',
                                borderRadius: 'var(--radius-sm)',
                                transition: 'background 0.2s',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                borderBottom: '1px solid rgba(255,255,255,0.03)'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                                  {p.nombre} {p.parentesco ? `(${p.parentesco})` : ''}
                                </span>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {p.email || 'Sin correo registrado'}
                                </span>
                              </div>
                              <span 
                                style={{ 
                                  fontSize: '0.85rem', 
                                  background: 'rgba(107, 144, 128, 0.15)', 
                                  color: 'var(--color-primary, #6b9080)', 
                                  padding: '2px 8px', 
                                  borderRadius: '12px',
                                  fontWeight: '600'
                                }}
                              >
                                DNI: {p.dni || 'S/D'}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div 
                    className="glass-card" 
                    style={{ 
                      padding: '20px', 
                      background: 'rgba(255,255,255,0.03)', 
                      border: '1px solid var(--border-glass)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div 
                        style={{ 
                          width: '45px', 
                          height: '45px', 
                          borderRadius: '50%', 
                          background: 'rgba(107, 144, 128, 0.2)', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: 'var(--color-primary)'
                        }}
                      >
                        <User size={22} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '600' }}>
                          {selectedPatient ? `${selectedPatient.nombre}${selectedPatient.parentesco ? ` (${selectedPatient.parentesco})` : ''}` : 'Cargando...'}
                        </h4>
                        <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                          {selectedPatient ? (
                            <>
                              DNI: <span style={{ color: 'var(--color-primary)', fontWeight: '600' }}>{selectedPatient.dni || 'No registrado'}</span>
                              {selectedPatient.email && ` • ${selectedPatient.email}`}
                            </>
                          ) : `ID Paciente: ${selectedPatientId}`}
                        </p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-secondary" 
                      onClick={() => {
                        setSelectedPatientId('')
                        setSearchTerm('')
                      }}
                      style={{ minHeight: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                    >
                      Cambiar
                    </button>
                  </div>
                )}
              </div>
            )}

            {loadingHistory ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Cargando expediente...</div>
            ) : !selectedPatientId ? (
              <div className="input-glass" style={{ color: 'var(--text-muted)', textAlign: 'center', borderStyle: 'dashed', background: 'rgba(255,255,255,0.01)' }}>
                Selecciona un paciente para visualizar su historial clínico
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* ID Historia */}
                  <span>Nro. Expediente: {historiaId ? historiaId : 'No creado'}</span>

                {/* Lista de Notas de Evolución */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '8px' }}>
                  {notes.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '20px 0' }}>
                      No se registran notas de evolución en este expediente clínico.
                    </div>
                  ) : (
                    notes.map((note, index) => {
                      const isExpanded = expandedNotes[note.id] ?? (index === notes.length - 1);
                      return (
                        <div 
                          key={note.id} 
                          className="glass-card" 
                          style={{ 
                            padding: '16px', 
                            background: 'rgba(255,255,255,0.02)', 
                            borderLeft: '4px solid var(--color-primary)',
                            borderRadius: 'var(--radius-sm)'
                          }}
                        >
                          <div 
                            onClick={() => toggleNote(note.id, index, notes.length)}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              cursor: 'pointer',
                              fontSize: '0.85rem', 
                              color: 'var(--text-muted)',
                              userSelect: 'none',
                              padding: '4px 6px',
                              borderRadius: '4px',
                              transition: 'background 0.2s',
                              marginBottom: isExpanded ? '12px' : '0',
                              borderBottom: isExpanded ? '1px solid rgba(255,255,255,0.05)' : 'none',
                              paddingBottom: isExpanded ? '8px' : '4px'
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500' }}>
                                <User size={14} className="text-primary" />
                                Firma: Médico Registrado
                              </span>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Calendar size={14} />
                                {note.fecha}
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-primary)' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: '600' }}>
                                {isExpanded ? 'Plegar' : 'Desplegar'}
                              </span>
                              {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                          </div>
                          {isExpanded && (
                            containsHTML(note.contenido) ? (
                              <div 
                                style={{ fontSize: '0.95rem', lineHeight: '1.5' }} 
                                dangerouslySetInnerHTML={{ __html: note.contenido }} 
                              />
                            ) : (
                              <div style={{ fontSize: '0.95rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                {note.contenido}
                              </div>
                            )
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Agregar Nota Clinica (Sólo Médicos) */}
                {isMedico && (
                  <form onSubmit={handleAddNote} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '24px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', margin: 0 }}>Nueva Nota de Evolución</h3>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '6px', minHeight: 'auto', background: 'rgba(107, 144, 128, 0.15)', border: '1px solid rgba(107, 144, 128, 0.2)' }}
                        onClick={handleAISuggestNote}
                        disabled={submitting || loadingAINote || !newNoteContent}
                        title="Escribe unas palabras clave y presiona aquí para que la IA estructure tu nota en formato SOAP"
                      >
                        <Sparkles size={12} className={loadingAINote ? 'animate-spin' : ''} />
                        <span>{loadingAINote ? 'Escribiendo...' : 'Optimizar con IA'}</span>
                      </button>
                    </div>
                    
                    <div className="form-group">
                      {aiUnavailableNote && (
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.1)',
                          border: '1px solid rgba(245, 158, 11, 0.3)',
                          color: '#f59e0b',
                          padding: '10px 14px',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: '0.85rem',
                          marginBottom: '14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                          <span>
                            <strong>Asistente IA no disponible:</strong> Se ha generado una plantilla clínica editable de respaldo. Escriba o modifique lo que desee.
                          </span>
                        </div>
                      )}
                      <textarea
                        ref={noteTextareaRef}
                        className="input-glass"
                        placeholder="Escribe el diagnóstico, evolución, síntomas y plan de tratamiento del paciente..."
                        value={newNoteContent}
                        onChange={e => setNewNoteContent(e.target.value)}
                        onFocus={() => setNoteFocused(true)}
                        onBlur={() => setNoteFocused(false)}
                        style={{ 
                          width: '100%', 
                          resize: 'vertical',
                          overflowY: 'hidden'
                        }}
                        disabled={submitting}
                      />
                    </div>
                    
                    <button type="submit" className="btn btn-primary" disabled={submitting || !newNoteContent}>
                      <Plus size={18} />
                      <span>Agregar Nota Evolución</span>
                    </button>
                  </form>
                )}

              </div>
            )}
          </div>

          {/* Formulario de Emisión de Receta (Sólo Médicos) */}
          {isMedico && selectedPatientId && (
            <div className="glass-card" style={{ padding: '30px' }}>
              <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles className="text-secondary" size={22} />
                Emitir Receta Médica
              </h2>

              <form onSubmit={handleCreateRecipe}>
                <div className="form-group">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label htmlFor="hc-indicaciones" style={{ margin: 0 }}>Indicaciones Farmacéuticas</label>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '4px 10px', fontSize: '0.75rem', gap: '6px', minHeight: 'auto', background: 'rgba(107, 144, 128, 0.15)', border: '1px solid rgba(107, 144, 128, 0.2)' }}
                      onClick={handleAISuggestRecipe}
                      disabled={submitting || loadingAIRecipe || !newRecipeIndications}
                      title="Escribe la pauta básica (ej: amoxicilina 500 c/8h 7d) y presiona aquí para que la IA la detalle"
                    >
                      <Sparkles size={12} className={loadingAIRecipe ? 'animate-spin' : ''} />
                      <span>{loadingAIRecipe ? 'Redactando...' : 'Optimizar con IA'}</span>
                    </button>
                  </div>
                  {aiUnavailableRecipe && (
                    <div style={{
                      background: 'rgba(245, 158, 11, 0.1)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      color: '#f59e0b',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '0.85rem',
                      marginBottom: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <AlertTriangle size={16} style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Asistente IA no disponible:</strong> Se ha generado una plantilla de receta editable de respaldo. Escriba o modifique lo que desee.
                      </span>
                    </div>
                  )}
                  <textarea
                    id="hc-indicaciones"
                    ref={recipeTextareaRef}
                    className="input-glass"
                    placeholder="Ej. Ibuprofeno 600mg cada 8hs por 5 días. Amoxicilina 500mg cada 12hs por 7 días."
                    value={newRecipeIndications}
                    onChange={e => setNewRecipeIndications(e.target.value)}
                    onFocus={() => setRecipeFocused(true)}
                    onBlur={() => setRecipeFocused(false)}
                    style={{ 
                      width: '100%', 
                      resize: 'vertical',
                      overflowY: 'hidden'
                    }}
                    disabled={submitting}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={submitting || !newRecipeIndications}>
                  <FileText size={18} />
                  <span>Emitir Receta Digital</span>
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Lado Derecho: Buscador de Recetas y Fichas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Buscador de Recetas */}
          <div className="glass-card" style={{ padding: '30px' }}>
            <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Search className="text-secondary" size={22} />
              Buscar Receta
            </h2>

            <form onSubmit={handleSearchRecipe}>
              <div className="form-group">
                <label htmlFor="rec-search-id">Código de Receta</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input
                    id="rec-search-id"
                    type="text"
                    className="input-glass"
                    placeholder="Ej. 5"
                    value={searchRecipeId}
                    onChange={e => setSearchRecipeId(e.target.value)}
                    style={{ flexGrow: 1 }}
                    disabled={loadingRecipe}
                  />
                  <button type="submit" className="btn btn-secondary" style={{ padding: '12px' }} disabled={loadingRecipe}>
                    <Search size={18} />
                  </button>
                </div>
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

                <h4 style={{ fontSize: '0.9rem', color: 'var(--color-primary)', marginBottom: '8px' }}>Indicaciones:</h4>
                {containsHTML(searchedRecipe.indicaciones) ? (
                  <div 
                    style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.5' }}
                    dangerouslySetInnerHTML={{ __html: searchedRecipe.indicaciones }}
                  />
                ) : (
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', fontStyle: 'italic', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {searchedRecipe.indicaciones}
                  </div>
                )}

                <button 
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '20px', gap: '8px', fontSize: '0.8rem', padding: '8px 12px' }}
                  onClick={() => window.print()}
                >
                  <Printer size={14} />
                  <span>Imprimir Receta</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </>
  )
}
