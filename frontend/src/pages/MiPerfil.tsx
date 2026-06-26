import React, { useEffect, useState } from 'react'
import { api } from '../services/api'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { 
  User, 
  Lock, 
  Mail, 
  MapPin, 
  Save, 
  ShieldAlert, 
  KeyRound,
  Inbox
} from 'lucide-react'


export default function MiPerfil() {
  const { user } = useAuthStore()
  const showToast = useToastStore(state => state.showToast)
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'email'>('profile')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  
  // Entity IDs derived from email lookup
  const [pacienteId, setPacienteId] = useState<number | null>(null)

  // Account details (from /usuario or entity)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [dni, setDni] = useState('')
  
  // Professional details (only for Medico)
  const [matricula, setMatricula] = useState('')
  const [especialidad, setEspecialidad] = useState('ORTOPEDIA')

  // Address (for Medico and Paciente)
  const [calle, setCalle] = useState('')
  const [numero, setNumero] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [provincia, setProvincia] = useState('')
  const [pais, setPais] = useState('')

  // Security Form
  const [passwordActual, setPasswordActual] = useState('')
  const [nuevaPassword, setNuevaPassword] = useState('')
  const [repetirPassword, setRepetirPassword] = useState('')

  // Email Change Form
  const [nuevoEmail, setNuevoEmail] = useState('')
  const [confirmEmailToken, setConfirmEmailToken] = useState('')
  
  const isMedico = user?.roles.includes('ROLE_MEDICO')
  const isPaciente = user?.roles.includes('ROLE_PACIENTE')

  const fetchProfile = async () => {
    setLoading(true)
    try {
      if (isMedico) {
        // Find medico by email matching logged in user
        const listRes = await api.get('/medicos?page=0&size=100')
        const matched = listRes.data.data.content?.find((m: any) => m.email === user?.email)
        if (matched) {
          // Fetch full medico detail
          const detailRes = await api.get(`/medicos/${matched.id}`)
          if (detailRes.data.success) {
            const data = detailRes.data.data
            setNombre(data.nombre || '')
            setTelefono(data.telefono || '')
            setDni(data.dni || '')
            setMatricula(data.matricula || '')
            setEspecialidad(data.especialidad || 'ORTOPEDIA')
            if (data.direccion) {
              setCalle(data.direccion.calle || '')
              setNumero(data.direccion.numero || '')
              setCiudad(data.direccion.ciudad || '')
              setProvincia(data.direccion.provincia || '')
              setPais(data.direccion.pais || '')
            }
          }
        }
      } else if (isPaciente) {
        // Find patient by email matching logged in user
        const listRes = await api.get('/pacientes?page=0&size=100')
        const matched = listRes.data.data.content?.find((p: any) => p.email === user?.email)
        if (matched) {
          setPacienteId(matched.id)
          // Fetch full patient detail
          const detailRes = await api.get(`/pacientes/${matched.id}`)
          if (detailRes.data.success) {
            const data = detailRes.data.data
            setNombre(data.nombre || '')
            setTelefono(data.telefono || '')
            setDni(data.dni || '')
            if (data.direccion) {
              setCalle(data.direccion.calle || '')
              setNumero(data.direccion.numero || '')
              setCiudad(data.direccion.ciudad || '')
              setProvincia(data.direccion.provincia || '')
              setPais(data.direccion.pais || '')
            }
          }
        }
      } else {
        // For general users (Admin, Recepcionistas), we don't have detail lookup by email
        // We'll set defaults from jwt store
        setNombre(user?.email.split('@')[0] || '')
      }
    } catch (err: any) {
      console.error(err)
      showToast('Error al cargar datos del perfil', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nombre) {
      showToast('El nombre es obligatorio', 'error')
      return
    }

    setSubmitting(true)
    try {
      if (isMedico) {
        // Update medico own profile: PUT /medicos/mi-perfil
        const payload = {
          nombre,
          telefono,
          dni,
          matricula,
          especialidad,
          direccion: { calle, numero, ciudad, provincia, pais }
        }
        await api.put('/medicos/mi-perfil', payload, {
          headers: { email: user?.email }
        })
        showToast('Perfil profesional de médico actualizado', 'success')
      } else if (isPaciente && pacienteId) {
        // Update patient: PUT /pacientes/{id}
        const payload = {
          id: pacienteId,
          nombre,
          telefono,
          documentoIdentidad: dni,
          direccion: { calle, numero, ciudad, provincia, pais }
        }
        await api.put(`/pacientes/${pacienteId}`, payload, {
          headers: { email: user?.email }
        })
        showToast('Perfil de paciente actualizado correctamente', 'success')
      } else {
        // General user: PUT /usuario/{id}
        const payload = {
          nombre,
          telefono,
          dni
        }
        await api.put(`/usuario/${user?.id}`, payload)
        showToast('Perfil de usuario actualizado correctamente', 'success')
      }
      fetchProfile()
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al actualizar el perfil'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!passwordActual || !nuevaPassword || !repetirPassword) {
      showToast('Por favor completa todos los campos de contraseña', 'error')
      return
    }
    if (nuevaPassword !== repetirPassword) {
      showToast('La nueva contraseña y su repetición no coinciden', 'error')
      return
    }

    setSubmitting(true)
    try {
      await api.patch(`/usuario/${user?.id}/password`, {
        passwordActual,
        nuevaPassword,
        repetirPassword
      })
      showToast('Contraseña cambiada correctamente', 'success')
      setPasswordActual('')
      setNuevaPassword('')
      setRepetirPassword('')
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al cambiar la contraseña'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleRequestEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoEmail) {
      showToast('Introduce el nuevo correo electrónico', 'error')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/usuario/cambio-email', { nuevoEmail })
      showToast('Solicitud enviada. Revisa el buzón de tu nuevo correo.', 'success')
      setNuevoEmail('')
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al solicitar cambio de correo'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleConfirmEmailChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!confirmEmailToken) {
      showToast('Introduce el token de confirmación', 'error')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/usuario/confirmar-cambio-email', { token: confirmEmailToken })
      showToast('Correo electrónico actualizado correctamente. Por favor inicia sesión de nuevo.', 'success')
      setConfirmEmailToken('')
      // Log out
      useAuthStore.getState().clearAuth()
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al confirmar cambio de correo'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="header-actions">
        <div>
          <h1 className="page-title">Mi Cuenta</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Configura tus datos de perfil, preferencias de contacto y credenciales de seguridad.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '30px', alignItems: 'start' }}>
        
        {/* Menu de Tabs */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('profile')}
          >
            <User size={18} />
            <span>Datos de Perfil</span>
          </button>
          
          <button 
            className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={18} />
            <span>Contraseña</span>
          </button>

          <button 
            className={`btn ${activeTab === 'email' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%' }}
            onClick={() => setActiveTab('email')}
          >
            <Mail size={18} />
            <span>Correo Electrónico</span>
          </button>
        </div>

        {/* Contenido de Tab */}
        <div className="glass-card" style={{ padding: '30px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Cargando perfil...
            </div>
          ) : (
            <>
              {activeTab === 'profile' && (
                <form onSubmit={handleUpdateProfile}>
                  <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <User className="text-primary" size={22} />
                    Información del Perfil
                  </h2>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div className="form-group">
                      <label htmlFor="pref-nombre">Nombre Completo</label>
                      <input
                        id="pref-nombre"
                        type="text"
                        className="input-glass"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        disabled={submitting}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pref-telefono">Teléfono</label>
                      <input
                        id="pref-telefono"
                        type="text"
                        className="input-glass"
                        value={telefono}
                        onChange={e => setTelefono(e.target.value)}
                        disabled={submitting}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="pref-dni">Documento / DNI</label>
                      <input
                        id="pref-dni"
                        type="text"
                        className="input-glass"
                        value={dni}
                        onChange={e => setDni(e.target.value)}
                        disabled={submitting || isMedico} // Medicos shouldn't overwrite DNI directly if restricted
                      />
                    </div>

                    {isMedico && (
                      <div className="form-group">
                        <label htmlFor="pref-matricula">Matrícula Nacional</label>
                        <input
                          id="pref-matricula"
                          type="text"
                          className="input-glass"
                          value={matricula}
                          onChange={e => setMatricula(e.target.value)}
                          disabled={submitting}
                        />
                      </div>
                    )}
                  </div>

                  {isMedico && (
                    <div className="form-group" style={{ marginTop: '10px' }}>
                      <label htmlFor="pref-especialidad">Especialidad Clínica</label>
                      <select
                        id="pref-especialidad"
                        className="input-glass"
                        value={especialidad}
                        onChange={e => setEspecialidad(e.target.value)}
                        style={{ background: 'var(--bg-obsidian-darker)', width: '100%' }}
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
                  )}

                  {/* Dirección (Medicos & Pacientes) */}
                  {(isMedico || isPaciente) && (
                    <>
                      <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginTop: '30px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MapPin size={18} />
                        Dirección Registrada
                      </h3>

                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                        <div className="form-group">
                          <label htmlFor="pref-calle">Calle / Avenida</label>
                          <input
                            id="pref-calle"
                            type="text"
                            className="input-glass"
                            value={calle}
                            onChange={e => setCalle(e.target.value)}
                            disabled={submitting}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="pref-numero">Número</label>
                          <input
                            id="pref-numero"
                            type="text"
                            className="input-glass"
                            value={numero}
                            onChange={e => setNumero(e.target.value)}
                            disabled={submitting}
                          />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginTop: '10px' }}>
                        <div className="form-group">
                          <label htmlFor="pref-ciudad">Ciudad</label>
                          <input
                            id="pref-ciudad"
                            type="text"
                            className="input-glass"
                            value={ciudad}
                            onChange={e => setCiudad(e.target.value)}
                            disabled={submitting}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="pref-provincia">Provincia / Estado</label>
                          <input
                            id="pref-provincia"
                            type="text"
                            className="input-glass"
                            value={provincia}
                            onChange={e => setProvincia(e.target.value)}
                            disabled={submitting}
                          />
                        </div>

                        <div className="form-group">
                          <label htmlFor="pref-pais">País</label>
                          <input
                            id="pref-pais"
                            type="text"
                            className="input-glass"
                            value={pais}
                            onChange={e => setPais(e.target.value)}
                            disabled={submitting}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '30px' }} disabled={submitting}>
                    <Save size={18} />
                    <span>{submitting ? 'Guardando...' : 'Guardar Cambios'}</span>
                  </button>
                </form>
              )}

              {activeTab === 'security' && (
                <form onSubmit={handleChangePassword}>
                  <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <KeyRound className="text-primary" size={22} />
                    Modificar Credenciales
                  </h2>

                  <div className="form-group">
                    <label htmlFor="sec-actual">Contraseña Actual</label>
                    <input
                      id="sec-actual"
                      type="password"
                      className="input-glass"
                      placeholder="••••••••"
                      value={passwordActual}
                      onChange={e => setPasswordActual(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sec-nueva">Nueva Contraseña</label>
                    <input
                      id="sec-nueva"
                      type="password"
                      className="input-glass"
                      placeholder="••••••••"
                      value={nuevaPassword}
                      onChange={e => setNuevaPassword(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="sec-repetir">Confirmar Nueva Contraseña</label>
                    <input
                      id="sec-repetir"
                      type="password"
                      className="input-glass"
                      placeholder="••••••••"
                      value={repetirPassword}
                      onChange={e => setRepetirPassword(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ marginTop: '20px' }} disabled={submitting}>
                    <Lock size={18} />
                    <span>{submitting ? 'Actualizando clave...' : 'Actualizar Contraseña'}</span>
                  </button>
                </form>
              )}

              {activeTab === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
                  
                  {/* Solicitar cambio */}
                  <form onSubmit={handleRequestEmailChange}>
                    <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Mail className="text-primary" size={22} />
                      Solicitud de Cambio de Correo
                    </h2>
                    
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                      Al solicitar un cambio, se enviará un token de verificación al nuevo correo electrónico introducido. Tu email actual seguirá activo hasta que confirmes el token.
                    </p>

                    <div className="form-group">
                      <label htmlFor="mail-nuevo">Nuevo Correo Electrónico</label>
                      <input
                        id="mail-nuevo"
                        type="email"
                        className="input-glass"
                        placeholder="nuevo.correo@example.com"
                        value={nuevoEmail}
                        onChange={e => setNuevoEmail(e.target.value)}
                        disabled={submitting}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary" disabled={submitting}>
                      <Inbox size={18} />
                      <span>{submitting ? 'Solicitando...' : 'Solicitar Enlace de Cambio'}</span>
                    </button>
                  </form>

                  {/* Confirmar cambio */}
                  <form onSubmit={handleConfirmEmailChange} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '30px' }}>
                    <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <ShieldAlert className="text-secondary" size={22} />
                      Confirmar Token de Correo
                    </h2>
                    
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                      Introduce el código o token de confirmación recibido en tu nuevo buzón de correo electrónico para aplicar el cambio definitivo.
                    </p>

                    <div className="form-group">
                      <label htmlFor="mail-token">Token de Confirmación</label>
                      <input
                        id="mail-token"
                        type="text"
                        className="input-glass"
                        placeholder="Pega el token aquí"
                        value={confirmEmailToken}
                        onChange={e => setConfirmEmailToken(e.target.value)}
                        disabled={submitting}
                      />
                    </div>

                    <button type="submit" className="btn btn-secondary" style={{ borderColor: 'var(--color-secondary)', color: 'var(--color-secondary)' }} disabled={submitting}>
                      <span>{submitting ? 'Confirmando...' : 'Confirmar y Cambiar Correo'}</span>
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </>
  )
}
