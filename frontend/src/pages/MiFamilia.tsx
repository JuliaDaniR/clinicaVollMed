import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { 
  Users, 
  UserPlus, 
  Trash2, 
  X, 
  Calendar, 
  Hash, 
  Home, 
  ShieldCheck
} from 'lucide-react'

interface Familiar {
  id: number
  nombre: string
  dni: string
  fechaNacimiento: string
  parentesco: string
  activo: boolean
}

export default function MiFamilia() {
  const { user } = useAuthStore()
  const showToast = useToastStore(state => state.showToast)
  
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [titularPatient, setTitularPatient] = useState<any>(null)
  const [familia, setFamilia] = useState<Familiar[]>([])
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [selectedFamiliar, setSelectedFamiliar] = useState<Familiar | null>(null)

  // Form states for new dependent
  const [nombre, setNombre] = useState('')
  const [dni, setDni] = useState('')
  const [fechaNacimiento, setFechaNacimiento] = useState('')
  const [telefono, setTelefono] = useState('')
  const [parentesco, setParentesco] = useState('HIJO_A')
  
  // Address states
  const [copiarDireccion, setCopiarDireccion] = useState(true)
  const [calle, setCalle] = useState('')
  const [numero, setNumero] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [pais, setPais] = useState('')

  const fetchFamilia = async () => {
    setLoading(true)
    try {
      // 1. Encontrar el paciente titular
      const listRes = await api.get('/pacientes?page=0&size=100')
      const matched = listRes.data.data.content?.find((p: any) => p.email === user?.email)
      
      if (matched) {
        setTitularPatient(matched)
        // 2. Traer su grupo familiar
        const famRes = await api.get(`/pacientes/${matched.id}/familia`)
        if (famRes.data.success) {
          setFamilia(famRes.data.data || [])
        }
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al cargar grupo familiar', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFamilia()
  }, [])

  const handleAddFamiliar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre || !fechaNacimiento || !parentesco) {
      showToast('Por favor completa todos los campos requeridos', 'error')
      return
    }

    setSubmitting(true)
    try {
      const payload: any = {
        nombre,
        dni: dni || null,
        fechaNacimiento,
        telefono: telefono || null,
        parentesco,
      }

      if (copiarDireccion && titularPatient?.id) {
        // Obtener dirección del titular
        const detailRes = await api.get(`/pacientes/${titularPatient.id}`)
        if (detailRes.data.success && detailRes.data.data.direccion) {
          payload.direccion = detailRes.data.data.direccion
        }
      } else {
        payload.direccion = { calle, numero, ciudad, provincia, pais }
      }

      const response = await api.post(`/pacientes/${titularPatient.id}/familia`, payload)
      if (response.data.success) {
        showToast('Familiar agregado exitosamente', 'success')
        setIsAddModalOpen(false)
        // Reset form
        setNombre('')
        setDni('')
        setFechaNacimiento('')
        setTelefono('')
        setParentesco('HIJO_A')
        setCalle('')
        setNumero('')
        setCiudad('')
        setProvincia('')
        setPais('')
        await fetchFamilia()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al agregar familiar'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteFamiliar = async () => {
    if (!selectedFamiliar || !titularPatient) return
    setSubmitting(true)
    try {
      await api.delete(`/pacientes/${titularPatient.id}/familia/${selectedFamiliar.id}`)
      showToast('Familiar desvinculado correctamente', 'success')
      setIsDeleteModalOpen(false)
      setSelectedFamiliar(null)
      await fetchFamilia()
    } catch (err: any) {
      console.error(err)
      showToast('Error al desvincular familiar', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const getParentescoLabel = (parentesco: string) => {
    switch (parentesco) {
      case 'HIJO_A': return 'Hijo/a'
      case 'CONYUGUE': return 'Cónyuge'
      case 'PADRE_MADRE': return 'Padre/Madre'
      case 'HERMANO_A': return 'Hermano/a'
      case 'ABUELO_A': return 'Abuelo/a'
      case 'NIETO_A': return 'Nieto/a'
      case 'TUTOR_LEGAL': return 'Tutor Legal'
      default: return 'Otro'
    }
  }

  const getParentescoBadgeStyle = (parentesco: string) => {
    switch (parentesco) {
      case 'HIJO_A': return { background: 'rgba(107, 144, 128, 0.15)', color: 'var(--color-primary)' }
      case 'CONYUGUE': return { background: 'rgba(233, 196, 106, 0.15)', color: 'var(--color-accent)' }
      case 'PADRE_MADRE': return { background: 'rgba(109, 91, 208, 0.15)', color: '#a78bfa' }
      default: return { background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-muted)' }
    }
  }

  return (
    <>
      <div className="header-actions">
        <div>
          <h1 className="page-title">Mi Grupo Familiar</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Registra y gestiona los miembros de tu familia para reservar sus citas e historiales médicos.
          </p>
        </div>
        <button 
          className="btn btn-primary"
          onClick={() => setIsAddModalOpen(true)}
          disabled={loading || !titularPatient}
        >
          <UserPlus size={18} />
          <span>Agregar Familiar</span>
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Cargando grupo familiar...
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* Titular Card */}
          {titularPatient && (
            <div className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '4px solid var(--color-primary)' }}>
              <div style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.2rem',
                fontWeight: '800',
                color: 'var(--bg-obsidian-darker)'
              }}>
                {titularPatient.nombre?.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: '700', margin: 0 }}>{titularPatient.nombre}</h3>
                  <span style={{ 
                    fontSize: '0.7rem', 
                    background: 'rgba(107, 144, 128, 0.2)', 
                    color: 'var(--color-primary)', 
                    padding: '2px 8px', 
                    borderRadius: '20px', 
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <ShieldCheck size={12} />
                    Titular de Cuenta
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px', display: 'flex', gap: '15px' }}>
                  <span>DNI: {titularPatient.dni || 'No registrado'}</span>
                  <span>•</span>
                  <span>Email: {user?.email}</span>
                </p>
              </div>
            </div>
          )}

          {/* Dependents Grid */}
          <div>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users className="text-secondary" size={20} />
              Familiares Dependientes
            </h2>

            {familia.length === 0 ? (
              <div className="glass-card" style={{ padding: '40px', textAlign: 'center', borderStyle: 'dashed' }}>
                <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>
                  No tienes ningún familiar registrado todavía.
                </p>
                <button 
                  className="btn btn-secondary"
                  onClick={() => setIsAddModalOpen(true)}
                  style={{ margin: '0 auto' }}
                >
                  <UserPlus size={16} />
                  <span>Registrar Primer Familiar</span>
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                {familia.map(f => {
                  const badgeStyle = getParentescoBadgeStyle(f.parentesco)
                  return (
                    <div key={f.id} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative' }}>
                      <button 
                        style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', opacity: 0.7 }}
                        onClick={() => {
                          setSelectedFamiliar(f)
                          setIsDeleteModalOpen(true)
                        }}
                        title="Desvincular familiar"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'rgba(255,255,255,0.05)',
                          border: '1px solid var(--border-glass)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.9rem',
                          fontWeight: '700',
                          color: 'var(--color-primary)'
                        }}>
                          {f.nombre?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h4 style={{ fontWeight: '700', fontSize: '1rem', margin: 0 }}>{f.nombre}</h4>
                          <span style={{ 
                            fontSize: '0.65rem', 
                            background: badgeStyle.background, 
                            color: badgeStyle.color, 
                            padding: '1px 6px', 
                            borderRadius: '10px', 
                            fontWeight: '750',
                            marginTop: '4px',
                            display: 'inline-block'
                          }}>
                            {getParentescoLabel(f.parentesco).toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--border-glass)', paddingTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Hash size={14} />
                          <span>DNI: {f.dni || 'No registrado'}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={14} />
                          <span>F. Nacimiento: {f.fechaNacimiento ? new Date(f.fechaNacimiento).toLocaleDateString('es-ES', { timeZone: 'UTC' }) : 'No registrada'}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: AGREGAR FAMILIAR */}
      {isAddModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '550px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2 className="modal-title">Agregar Familiar</h2>
              <button className="close-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFamiliar}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group" style={{ gridColumn: 'span 2' }}>
                  <label htmlFor="fam-nombre">Nombre Completo *</label>
                  <input
                    id="fam-nombre"
                    type="text"
                    required
                    className="input-glass"
                    value={nombre}
                    onChange={e => setNombre(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fam-dni">DNI / Documento</label>
                  <input
                    id="fam-dni"
                    type="text"
                    className="input-glass"
                    value={dni}
                    onChange={e => setDni(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fam-nacimiento">F. Nacimiento *</label>
                  <input
                    id="fam-nacimiento"
                    type="date"
                    required
                    className="input-glass"
                    value={fechaNacimiento}
                    onChange={e => setFechaNacimiento(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fam-tel">Teléfono</label>
                  <input
                    id="fam-tel"
                    type="text"
                    className="input-glass"
                    value={telefono}
                    onChange={e => setTelefono(e.target.value)}
                    disabled={submitting}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="fam-parentesco">Parentesco *</label>
                  <select
                    id="fam-parentesco"
                    className="input-glass"
                    value={parentesco}
                    onChange={e => setParentesco(e.target.value)}
                    style={{ background: 'var(--bg-obsidian-darker)', width: '100%' }}
                    disabled={submitting}
                  >
                    <option value="HIJO_A">Hijo/a</option>
                    <option value="CONYUGUE">Cónyuge</option>
                    <option value="PADRE_MADRE">Padre/Madre</option>
                    <option value="HERMANO_A">Hermano/a</option>
                    <option value="ABUELO_A">Abuelo/a</option>
                    <option value="NIETO_A">Nieto/a</option>
                    <option value="TUTOR_LEGAL">Tutor Legal</option>
                    <option value="OTRO">Otro</option>
                  </select>
                </div>
              </div>

              {/* Dirección */}
              <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-glass)', paddingTop: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <Home size={16} className="text-primary" />
                  <span style={{ fontWeight: '700', fontSize: '0.9rem' }}>Dirección de Residencia</span>
                </div>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={copiarDireccion} 
                    onChange={e => setCopiarDireccion(e.target.checked)} 
                    disabled={submitting}
                  />
                  <span>Copiar misma dirección del titular de la cuenta</span>
                </label>

                {!copiarDireccion && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
                    <div className="form-group">
                      <label htmlFor="fam-calle">Calle / Avenida</label>
                      <input
                        id="fam-calle"
                        type="text"
                        className="input-glass"
                        value={calle}
                        onChange={e => setCalle(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="fam-num">Número</label>
                      <input
                        id="fam-num"
                        type="text"
                        className="input-glass"
                        value={numero}
                        onChange={e => setNumero(e.target.value)}
                        disabled={submitting}
                      />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 3', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                      <div>
                        <label htmlFor="fam-ciudad">Ciudad</label>
                        <input
                          id="fam-ciudad"
                          type="text"
                          className="input-glass"
                          value={ciudad}
                          onChange={e => setCiudad(e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label htmlFor="fam-prov">Provincia</label>
                        <input
                          id="fam-prov"
                          type="text"
                          className="input-glass"
                          value={provincia}
                          onChange={e => setProvincia(e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                      <div>
                        <label htmlFor="fam-pais">País</label>
                        <input
                          id="fam-pais"
                          type="text"
                          className="input-glass"
                          value={pais}
                          onChange={e => setPais(e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)} disabled={submitting}>
                  Cerrar
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Agregando...' : 'Confirmar Familiar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONFIRMACIÓN DESVINCULACIÓN */}
      {isDeleteModalOpen && selectedFamiliar && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Desvincular Familiar</h2>
              <button className="close-btn" onClick={() => setIsDeleteModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.5' }}>
              ¿Estás seguro de que deseas desvincular a <strong style={{ color: 'var(--text-main)' }}>{selectedFamiliar.nombre}</strong> de tu grupo familiar? 
              <br /><br />
              Esta acción desactivará su perfil de paciente y ya no aparecerá en tu listado ni podrás agendarle consultas. Sus historiales médicos anteriores se conservarán en el sistema por seguridad.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
              <button className="btn btn-secondary" onClick={() => setIsDeleteModalOpen(false)} disabled={submitting}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={handleDeleteFamiliar} disabled={submitting}>
                {submitting ? 'Desvinculando...' : 'Desvincular'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
