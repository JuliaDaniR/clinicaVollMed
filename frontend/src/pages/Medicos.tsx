import { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { 
  Stethoscope, 
  Plus, 
  X, 
  Trash2, 
  Check, 
  ChevronLeft, 
  ChevronRight, 
  Info,
  Edit,
  Mail,
  MoreVertical
} from 'lucide-react'
import ContactModal from '../components/ContactModal'

interface Doctor {
  id: number
  nombre: string
  email: string
  matricula: string
  especialidad: string
  activo: boolean
}

export default function Medicos() {
  const { user } = useAuthStore()
  const showToast = useToastStore(state => state.showToast)
  
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editDoctorId, setEditDoctorId] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // Contact Modal State
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactRecipientName, setContactRecipientName] = useState('')
  const [contactRecipientEmail, setContactRecipientEmail] = useState('')
  
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
  const [matricula, setMatricula] = useState('')
  const [especialidad, setEspecialidad] = useState('ORTOPEDIA')
  
  // Address State
  const [calle, setCalle] = useState('')
  const [numero, setNumero] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [pais, setPais] = useState('')

  const fetchDoctors = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/medicos?page=${page}&size=6`)
      if (response.data.success) {
        setDoctors(response.data.data.content || [])
        setTotalPages(response.data.data.totalPages || 1)
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al cargar la lista de médicos', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDoctors()
  }, [page])

  const handleOpenEditModal = async (doctor: Doctor) => {
    setSubmitting(true)
    try {
      const response = await api.get(`/medicos/${doctor.id}`)
      if (response.data.success) {
        const fullDoc = response.data.data
        setEditDoctorId(doctor.id)
        setNombre(fullDoc.nombre || '')
        setEmail(fullDoc.email || '')
        setTelefono(fullDoc.telefono || '')
        setDni(fullDoc.dni || '')
        setMatricula(fullDoc.matricula || '')
        setEspecialidad(fullDoc.especialidad || 'ORTOPEDIA')
        if (fullDoc.direccion) {
          setCalle(fullDoc.direccion.calle || '')
          setNumero(fullDoc.direccion.numero || '')
          setCiudad(fullDoc.direccion.ciudad || '')
          setProvincia(fullDoc.direccion.provincia || '')
          setPais(fullDoc.direccion.pais || '')
        }
        setIsModalOpen(true)
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al cargar detalles del médico', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editDoctorId) {
      // Edit Mode (PUT /medicos/{id})
      if (!matricula || !calle || !numero || !ciudad || !provincia || !pais) {
        showToast('Por favor completa todos los campos del consultorio', 'error')
        return
      }

      setSubmitting(true)
      try {
        const response = await api.put(`/medicos/${editDoctorId}`, {
          id: editDoctorId,
          matricula,
          especialidad,
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
          showToast('Médico actualizado correctamente', 'success')
          setIsModalOpen(false)
          resetForm()
          setEditDoctorId(null)
          fetchDoctors()
        }
      } catch (err: any) {
        console.error(err)
        const msg = err.response?.data?.message || 'Error al actualizar el médico'
        showToast(msg, 'error')
      } finally {
        setSubmitting(false)
      }
    } else {
      // Register Mode (POST /medicos)
      if (!nombre || !email || !clave || !telefono || !dni || !matricula || !calle || !numero || !ciudad || !provincia || !pais) {
        showToast('Por favor completa todos los campos del formulario', 'error')
        return
      }

      setSubmitting(true)
      try {
        const response = await api.post('/medicos', {
          nombre,
          email,
          clave,
          telefono,
          dni,
          matricula,
          especialidad,
          direccion: {
            calle,
            numero,
            ciudad,
            provincia,
            pais
          }
        })

        if (response.data.success) {
          showToast('Médico registrado correctamente', 'success')
          setIsModalOpen(false)
          resetForm()
          fetchDoctors()
        }
      } catch (err: any) {
        console.error(err)
        const msg = err.response?.data?.message || 'Error al registrar el médico'
        showToast(msg, 'error')
      } finally {
        setSubmitting(false)
      }
    }
  }

  const handleToggleStatus = async (id: number, currentlyActive: boolean) => {
    try {
      if (currentlyActive) {
        await api.delete(`/medicos/${id}`)
        showToast('Médico desactivado', 'success')
      } else {
        await api.patch(`/medicos/${id}/activar`)
        showToast('Médico activado', 'success')
      }
      fetchDoctors()
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
    setMatricula('')
    setEspecialidad('ORTOPEDIA')
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
          <h1 className="page-title">Directorio de Médicos</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Listado de profesionales médicos y control administrativo de credenciales.
          </p>
        </div>
        {canRegister && (
          <button className="btn btn-primary" onClick={() => {
            resetForm()
            setEditDoctorId(null)
            setIsModalOpen(true)
          }}>
            <Plus size={18} />
            <span>Registrar Médico</span>
          </button>
        )}
      </div>

      <div className="glass-card" style={{ padding: '24px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Cargando médicos...
          </div>
        ) : doctors.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Info size={32} style={{ color: 'var(--color-primary)' }} />
            <span>No se encontraron médicos registrados en el sistema.</span>
          </div>
        ) : (
          <>
            <div className="table-container">
              <table className="table-glass">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Matrícula</th>
                    <th>Especialidad</th>
                    <th>Estado</th>
                    {(canRegister || user?.roles.includes('ROLE_MEDICO')) && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doctor) => {
                    const hasActions = canRegister || isAdmin || doctor.email !== user?.email;
                    return (
                      <tr key={doctor.id}>
                        <td style={{ fontWeight: '600' }}>Dr. {doctor.nombre}</td>
                        <td>{doctor.email}</td>
                        <td style={{ fontFamily: 'monospace' }}>{doctor.matricula}</td>
                        <td>
                          <span className="badge badge-warning" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--color-secondary)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                            {doctor.especialidad.replace('_', ' ')}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${doctor.activo ? 'badge-success' : 'badge-danger'}`}>
                            {doctor.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        {(canRegister || user?.roles.includes('ROLE_MEDICO')) && (
                          <td style={{ position: 'relative', zIndex: activeDropdownId === doctor.id ? 50 : 'auto' }}>
                            {hasActions && (
                              <>
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
                                    setActiveDropdownId(activeDropdownId === doctor.id ? null : doctor.id)
                                  }}
                                >
                                  <MoreVertical size={16} />
                                </button>

                                {activeDropdownId === doctor.id && (
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
                                    {canRegister && (
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
                                          handleOpenEditModal(doctor)
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                      >
                                        <Edit size={14} className="text-primary" />
                                        <span>Editar</span>
                                      </button>
                                    )}
                                    
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
                                          color: doctor.activo ? 'var(--color-danger)' : 'var(--color-success)',
                                          gap: '10px'
                                        }}
                                        onClick={() => {
                                          setActiveDropdownId(null)
                                          handleToggleStatus(doctor.id, doctor.activo)
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                      >
                                        {doctor.activo ? <Trash2 size={14} /> : <Check size={14} />}
                                        <span>{doctor.activo ? 'Desactivar' : 'Activar'}</span>
                                      </button>
                                    )}
                                    
                                    {doctor.email !== user?.email && (
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
                                          setContactRecipientName(`Dr. ${doctor.nombre}`)
                                          setContactRecipientEmail(doctor.email)
                                          setIsContactOpen(true)
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                      >
                                        <Mail size={14} className="text-secondary" />
                                        <span>Contactar</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
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
                <Stethoscope size={24} className="text-primary" />
                {editDoctorId ? 'Modificar Perfil Profesional' : 'Registrar Nuevo Profesional'}
              </h2>
              <button className="close-btn" onClick={() => {
                setIsModalOpen(false)
                setEditDoctorId(null)
              }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} autoComplete="off">
              {/* Dummy inputs to prevent browser autofill */}
              <input type="text" style={{ display: 'none' }} autoComplete="off" />
              <input type="password" style={{ display: 'none' }} autoComplete="new-password" />

              <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginBottom: '16px' }}>Datos Personales y Profesionales</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="doc-nombre">Nombre Completo</label>
                  <input
                    id="doc-nombre"
                    type="text"
                    className="input-glass"
                    placeholder="Ej. Carlos Mendoza"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    disabled={submitting || editDoctorId !== null}
                    autoComplete="new-password"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc-email">Email Corporativo</label>
                  <input
                    id="doc-email"
                    type="email"
                    className="input-glass"
                    placeholder="carlos.mendoza@vollmed.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={submitting || editDoctorId !== null}
                    autoComplete="new-password"
                  />
                </div>

                {!editDoctorId && (
                  <div className="form-group">
                    <label htmlFor="doc-clave">Contraseña Inicial</label>
                    <input
                      id="doc-clave"
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
                  <label htmlFor="doc-telefono">Teléfono</label>
                  <input
                    id="doc-telefono"
                    type="text"
                    className="input-glass"
                    placeholder="+54911334455"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    disabled={submitting || editDoctorId !== null}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc-dni">Documento (DNI)</label>
                  <input
                    id="doc-dni"
                    type="text"
                    className="input-glass"
                    placeholder="12345678"
                    value={dni}
                    onChange={e => setDni(e.target.value)}
                    disabled={submitting || editDoctorId !== null}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="doc-matricula">Matrícula Nacional</label>
                  <input
                    id="doc-matricula"
                    type="text"
                    className="input-glass"
                    placeholder="MN-98765"
                    value={matricula}
                    onChange={e => setMatricula(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginTop: '10px' }}>
                <label htmlFor="doc-especialidad">Especialidad Médica</label>
                <select
                  id="doc-especialidad"
                  className="input-glass"
                  value={especialidad}
                  onChange={e => setEspecialidad(e.target.value)}
                  style={{ background: 'var(--bg-obsidian-darker)' }}
                  disabled={submitting}
                >
                  <option value="ORTOPEDIA">Ortopedia</option>
                  <option value="CARDIOLOGIA">Cardiología</option>
                  <option value="GINECOLOGIA">Ginecología</option>
                  <option value="PEDIATRIA">Pediatría</option>
                  <option value="DERMATOLOGIA">Dermatología</option>
                  <option value="PSICOLOGIA">Psicología</option>
                  <option value="ODONTOLOGIA">Odontología</option>
                  <option value="NEUROLOGIA">Neurología</option>
                  <option value="CLINICA_MEDICA">Clínica Médica</option>
                  <option value="TRAUMATOLOGIA">Traumatología</option>
                  <option value="NUTRICION">Nutrición</option>
                  <option value="OTORRINOLARINGOLOGIA">Otorrinolaringología</option>
                  <option value="UROLOGIA">Urología</option>
                  <option value="OFTALMOLOGIA">Oftalmología</option>
                </select>
              </div>

              <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', marginTop: '24px', marginBottom: '16px' }}>Dirección de Consultorio</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label htmlFor="dir-calle">Calle</label>
                  <input
                    id="dir-calle"
                    type="text"
                    className="input-glass"
                    placeholder="Av. del Libertador"
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
                    placeholder="1250"
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
                  setEditDoctorId(null)
                }} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Guardando...' : editDoctorId ? 'Guardar Cambios' : 'Registrar Profesional'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ContactModal
        isOpen={isContactOpen}
        onClose={() => setIsContactOpen(false)}
        recipientName={contactRecipientName}
        recipientEmail={contactRecipientEmail}
        senderName={
          doctors.find(d => d.email === user?.email)
            ? `Dr. ${doctors.find(d => d.email === user?.email)?.nombre}`
            : user?.roles.includes('ROLE_ADMIN')
              ? 'Administrador VollMed'
              : 'Recepcionista VollMed'
        }
        senderEmail={user?.email || ''}
        defaultSubject="Coordinación Clínica - VollMed"
      />
    </>
  )
}
