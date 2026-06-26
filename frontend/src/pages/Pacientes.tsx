import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { 
  Users, 
  Plus, 
  X, 
  Trash2, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Edit,
  MoreVertical
} from 'lucide-react'

interface Patient {
  id: number
  nombre: string
  email: string
  activo: boolean
}

export default function Pacientes() {
  const { user } = useAuthStore()
  const showToast = useToastStore(state => state.showToast)
  
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editPatientId, setEditPatientId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Dropdown State
  const [activeDropdownId, setActiveDropdownId] = useState<number | null>(null)

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveDropdownId(null)
    }
    window.addEventListener('click', handleOutsideClick)
    return () => window.removeEventListener('click', handleOutsideClick)
  }, [])

  // Form State
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')
  const [telefono, setTelefono] = useState('')
  const [dni, setDni] = useState('')
  
  // Address State
  const [calle, setCalle] = useState('')
  const [numero, setNumero] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [pais, setPais] = useState('')

  const fetchPatients = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/pacientes?page=${page}&size=6`)
      if (response.data.success) {
        setPatients(response.data.data.content || [])
        setTotalPages(response.data.data.totalPages || 1)
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al cargar la lista de pacientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [page])

  const handleOpenEditModal = async (patient: Patient) => {
    setSubmitting(true)
    try {
      const response = await api.get(`/pacientes/${patient.id}`)
      if (response.data.success) {
        const fullPat = response.data.data
        setEditPatientId(patient.id)
        setNombre(fullPat.nombre || '')
        setEmail(fullPat.email || '')
        setTelefono(fullPat.telefono || '')
        setDni(fullPat.dni || '')
        if (fullPat.direccion) {
          setCalle(fullPat.direccion.calle || '')
          setNumero(fullPat.direccion.numero || '')
          setCiudad(fullPat.direccion.ciudad || '')
          setProvincia(fullPat.direccion.provincia || '')
          setPais(fullPat.direccion.pais || '')
        }
        setIsModalOpen(true)
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al cargar detalles del paciente', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editPatientId) {
      // Edit Mode (PUT /pacientes/{id})
      if (!nombre || !telefono || !calle || !numero || !ciudad || !provincia || !pais) {
        showToast('Por favor completa todos los campos del formulario', 'error')
        return
      }

      setSubmitting(true)
      try {
        const response = await api.put(`/pacientes/${editPatientId}`, {
          id: editPatientId,
          nombre,
          telefono,
          documentoIdentidad: dni,
          direccion: {
            calle,
            numero,
            ciudad,
            provincia,
            pais
          }
        }, {
          headers: { email }
        })

        if (response.data.success) {
          showToast('Paciente actualizado correctamente', 'success')
          setIsModalOpen(false)
          resetForm()
          setEditPatientId(null)
          fetchPatients()
        }
      } catch (err: any) {
        console.error(err)
        const msg = err.response?.data?.message || 'Error al actualizar el paciente'
        showToast(msg, 'error')
      } finally {
        setSubmitting(false)
      }
    } else {
      // Register Mode (POST /pacientes)
      if (!nombre || !email || !clave || !telefono || !dni || !calle || !numero || !ciudad || !provincia || !pais) {
        showToast('Por favor completa todos los campos del formulario', 'error')
        return
      }

      setSubmitting(true)
      try {
        const response = await api.post('/pacientes', {
          nombre,
          email,
          clave,
          telefono,
          dni,
          direccion: {
            calle,
            numero,
            ciudad,
            provincia,
            pais
          }
        })

        if (response.data.success) {
          showToast('Paciente registrado correctamente', 'success')
          setIsModalOpen(false)
          resetForm()
          fetchPatients()
        }
      } catch (err: any) {
        console.error(err)
        const msg = err.response?.data?.message || 'Error al registrar el paciente'
        showToast(msg, 'error')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleToggleStatus = async (id: number, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await api.delete(`/pacientes/${id}`)
        showToast('Paciente desactivado', 'success')
      } else {
        await api.patch(`/pacientes/${id}/activar`)
        showToast('Paciente activado', 'success')
      }
      fetchPatients()
    } catch (err: any) {
      console.error(err)
      showToast('No tienes permisos suficientes o ocurrió un error', 'error')
    }
  }

  const resetForm = () => {
    setNombre('')
    setEmail('')
    setClave('')
    setTelefono('')
    setDni('')
    setCalle('')
    setNumero('')
    setCiudad('')
    setProvincia('')
    setPais('')
  }

  const isAdmin = user?.roles.includes('ROLE_ADMIN')
  const canRegister = user?.roles.some(r => ['ROLE_ADMIN', 'ROLE_RECEPCIONISTA'].includes(r))

  return (
    <>
      <div className="header-actions">
        <div>
          <h1 className="page-title">Registro de Pacientes</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Listado de pacientes registrados, historias clínicas asociadas y control de estado.
          </p>
        </div>
        {canRegister && (
          <button className="btn btn-primary" onClick={() => {
            resetForm()
            setEditPatientId(null)
            setIsModalOpen(true)
          }}>
            <Plus size={18} />
            <span>Registrar Paciente</span>
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Cargando pacientes...
          </div>
        ) : patients.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Info size={32} style={{ color: 'var(--color-primary)' }} />
            <span>No se encontraron pacientes registrados en el sistema.</span>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table-glass">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Estado</th>
                    {canRegister && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {patients.map((patient) => (
                    <tr key={patient.id}>
                      <td style={{ fontWeight: '600' }}>{patient.nombre}</td>
                      <td>{patient.email}</td>
                      <td>
                        <span className={`badge ${patient.activo ? 'badge-success' : 'badge-danger'}`}>
                          {patient.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      {canRegister && (
                        <td style={{ position: 'relative', zIndex: activeDropdownId === patient.id ? 50 : 'auto' }}>
                          <button
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
                              setActiveDropdownId(activeDropdownId === patient.id ? null : patient.id)
                            }}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeDropdownId === patient.id && (
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
                                  handleOpenEditModal(patient)
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                              >
                                <Edit size={14} className="text-primary" />
                                <span>Editar</span>
                              </button>

                              {isAdmin && (
                                <button
                                  className="btn"
                                  style={{ 
                                    padding: '8px 12px', 
                                    fontSize: '0.8rem', 
                                    justifyContent: 'flex-start', 
                                    border: 'none',
                                    background: 'transparent',
                                    width: '100%',
                                    color: patient.activo ? 'var(--color-danger)' : 'var(--color-success)',
                                    gap: '10px'
                                  }}
                                  onClick={() => {
                                    setActiveDropdownId(null)
                                    handleToggleStatus(patient.id, patient.activo)
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                >
                                  {patient.activo ? <Trash2 size={14} /> : <Check size={14} />}
                                  <span>{patient.activo ? 'Desactivar' : 'Activar'}</span>
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '16px', marginTop: '24px' }}>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px' }}
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  <ChevronLeft size={18} />
                </button>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  Página {page + 1} de {totalPages}
                </span>
                <button
                  className="btn btn-secondary"
                  style={{ padding: '8px' }}
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de Registro / Edición */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Users size={24} className="text-primary" />
                {editPatientId ? 'Modificar Información del Paciente' : 'Registrar Nuevo Paciente'}
              </h2>
              <button className="close-btn" onClick={() => {
                setIsModalOpen(false)
                setEditPatientId(null)
              }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} autoComplete="off">
              {/* Dummy inputs to prevent browser autofill */}
              <input type="text" style={{ display: 'none' }} autoComplete="off" />
              <input type="password" style={{ display: 'none' }} autoComplete="new-password" />

              <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '16px' }}>Datos Personales y Acceso</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="pac-nombre">Nombre Completo</label>
                  <input
                    id="pac-nombre"
                    type="text"
                    className="input-glass"
                    placeholder="Ej. María Gómez"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pac-email">Email</label>
                  <input
                    id="pac-email"
                    type="email"
                    className="input-glass"
                    placeholder="maria.gomez@example.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={submitting || editPatientId !== null}
                    autoComplete="new-password"
                  />
                </div>

                {!editPatientId && (
                  <div className="form-group">
                    <label htmlFor="pac-clave">Contraseña de Acceso</label>
                    <input
                      id="pac-clave"
                      type="password"
                      className="input-glass"
                      placeholder="••••••••"
                      value={clave}
                      onChange={e => setClave(e.target.value)}
                      disabled={submitting}
                      autoComplete="new-password"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="pac-telefono">Teléfono</label>
                  <input
                    id="pac-telefono"
                    type="text"
                    className="input-glass"
                    placeholder="+54911445566"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="pac-dni">Documento de Identidad (DNI)</label>
                  <input
                    id="pac-dni"
                    type="text"
                    className="input-glass"
                    placeholder="12345678"
                    value={dni}
                    onChange={e => setDni(e.target.value)}
                    disabled={submitting || editPatientId !== null}
                  />
                </div>
              </div>

              <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginTop: '24px', marginBottom: '16px' }}>Dirección de Residencia</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="dir-calle">Calle / Avenida</label>
                  <input
                    id="dir-calle"
                    type="text"
                    className="input-glass"
                    placeholder="Av. Rivadavia"
                    value={calle}
                    onChange={e => setCalle(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dir-numero">Número</label>
                  <input
                    id="dir-numero"
                    type="text"
                    className="input-glass"
                    placeholder="4510"
                    value={numero}
                    onChange={e => setNumero(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: '10px' }}>
                <div className="form-group">
                  <label htmlFor="dir-ciudad">Ciudad</label>
                  <input
                    id="dir-ciudad"
                    type="text"
                    className="input-glass"
                    placeholder="Buenos Aires"
                    value={ciudad}
                    onChange={e => setCiudad(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dir-provincia">Provincia / Estado</label>
                  <input
                    id="dir-provincia"
                    type="text"
                    className="input-glass"
                    placeholder="CABA"
                    value={provincia}
                    onChange={e => setProvincia(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="dir-pais">País</label>
                  <input
                    id="dir-pais"
                    type="text"
                    className="input-glass"
                    placeholder="Argentina"
                    value={pais}
                    onChange={e => setPais(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => {
                  setIsModalOpen(false)
                  setEditPatientId(null)
                }} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : editPatientId ? 'Guardar Cambios' : 'Registrar Paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
