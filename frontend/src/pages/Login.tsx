import React, { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { api } from '../services/api'
import { Activity, Lock, Mail, User, Phone, CreditCard, X } from 'lucide-react'

export default function Login() {
  const location = useLocation()
  const [isRegister, setIsRegister] = useState(() => {
    return location.state?.register === true
  })
  
  // Theme State
  const theme = localStorage.getItem('vollmed-theme') || 'default'

  useEffect(() => {
    if (theme === 'default') {
      document.body.removeAttribute('data-theme')
    } else {
      document.body.setAttribute('data-theme', theme)
    }
  }, [theme])


  // Login State
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  
  // Register State
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPassword, setRegPassword] = useState('')
  const [regPhone, setRegPhone] = useState('')
  const [regDni, setRegDni] = useState('')
  
  const [loading, setLoading] = useState(false)
  const setTokens = useAuthStore((state) => state.setTokens)
  const showToast = useToastStore((state) => state.showToast)
  const navigate = useNavigate()

  // Forgot Password / Reset Password State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetNewPassword, setResetNewPassword] = useState('')
  const [forgotStep, setForgotStep] = useState(1)
  const [forgotLoading, setForgotLoading] = useState(false)

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!forgotEmail) {
      showToast('Por favor introduce tu correo electrónico', 'error')
      return
    }
    setForgotLoading(true)
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail })
      showToast('Se ha enviado un token de recuperación a tu email', 'success')
      setForgotStep(2)
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al solicitar recuperación'
      showToast(msg, 'error')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resetToken || !resetNewPassword) {
      showToast('Por favor completa todos los campos', 'error')
      return
    }
    setForgotLoading(true)
    try {
      await api.post('/auth/reset-password', {
        token: resetToken,
        nuevaClave: resetNewPassword
      })
      showToast('Contraseña restablecida correctamente. Ya puedes iniciar sesión.', 'success')
      setIsForgotModalOpen(false)
      setForgotEmail('')
      setResetToken('')
      setResetNewPassword('')
      setForgotStep(1)
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al restablecer la contraseña'
      showToast(msg, 'error')
    } finally {
      setForgotLoading(false)
    }
  }

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!loginEmail || !loginPassword) {
      showToast('Por favor completa todos los campos', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/auth/login', {
        email: loginEmail,
        password: loginPassword,
      })

      const { access_token, refresh_token } = response.data.data
      setTokens(access_token, refresh_token)
      showToast('Sesión iniciada correctamente', 'success')
      navigate('/dashboard')
    } catch (err: any) {
      console.error(err)
      const errorMsg =
        err.response?.data?.message || 'Error de autenticación. Verifica tus credenciales.'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName || !regEmail || !regPassword || !regPhone || !regDni) {
      showToast('Por favor completa todos los campos obligatorios', 'error')
      return
    }

    setLoading(true)
    try {
      const response = await api.post('/pacientes', {
        nombre: regName,
        email: regEmail,
        clave: regPassword,
        telefono: regPhone,
        dni: regDni
      })

      if (response.data.success) {
        showToast('Usuario creado correctamente. Ya puedes iniciar sesión.', 'success')
        setIsRegister(false)
        // Auto fill email
        setLoginEmail(regEmail)
        setLoginPassword('')
      }
    } catch (err: any) {
      console.error(err)
      const errorMsg =
        err.response?.data?.message || 'Error al registrar el usuario.'
      showToast(errorMsg, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className={`login-card glass-card ${isRegister ? 'register-mode' : ''}`}>
        <div className="login-header" style={{ marginBottom: '20px' }}>
          <div className="login-logo" style={{ marginBottom: '14px' }}>
            <Activity size={36} className="logo-icon" />
            <h1 className="logo-text" style={{ fontSize: '2rem' }}>VollMed</h1>
          </div>
          
          {/* Tabs para Cambiar entre Login y Registro */}
          <div style={{ 
            display: 'flex', 
            background: 'rgba(255,255,255,0.03)', 
            borderRadius: 'var(--radius-sm)', 
            padding: '4px',
            marginBottom: '20px'
          }}>
            <button 
              type="button"
              onClick={() => setIsRegister(false)}
              style={{
                flex: 1,
                background: !isRegister ? 'var(--color-primary)' : 'transparent',
                color: !isRegister ? 'var(--bg-obsidian-darker)' : 'var(--text-muted)',
                border: 'none',
                padding: '8px',
                borderRadius: 'calc(var(--radius-sm) - 2px)',
                cursor: 'pointer',
                fontFamily: 'var(--font-title)',
                fontWeight: '600',
                transition: 'var(--transition-smooth)'
              }}
              disabled={loading}
            >
              Iniciar Sesión
            </button>
            <button 
              type="button"
              onClick={() => setIsRegister(true)}
              style={{
                flex: 1,
                background: isRegister ? 'var(--color-primary)' : 'transparent',
                color: isRegister ? 'var(--bg-obsidian-darker)' : 'var(--text-muted)',
                border: 'none',
                padding: '8px',
                borderRadius: 'calc(var(--radius-sm) - 2px)',
                cursor: 'pointer',
                fontFamily: 'var(--font-title)',
                fontWeight: '600',
                transition: 'var(--transition-smooth)'
              }}
              disabled={loading}
            >
              Registrarse
            </button>
          </div>

          <h2 className="login-title" style={{ fontSize: '1.4rem' }}>
            {!isRegister ? 'Acceder al Portal' : 'Crear Cuenta'}
          </h2>
          <p className="login-subtitle" style={{ fontSize: '0.85rem' }}>
            {!isRegister 
              ? 'Ingresa tus credenciales para acceder a la plataforma clínica' 
              : 'Completa los datos para registrar un nuevo usuario de prueba'
            }
          </p>
        </div>

        {!isRegister ? (
          /* LOGIN FORM */
          <form onSubmit={handleLoginSubmit} autoComplete="off">
            {/* Dummy inputs to prevent autofill */}
            <input type="text" style={{ display: 'none' }} autoComplete="off" />
            <input type="password" style={{ display: 'none' }} autoComplete="new-password" />
            <div className="form-group">
              <label htmlFor="login-email">Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <Mail 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)' 
                  }} 
                />
                <input
                  id="login-email"
                  type="email"
                  className="input-glass"
                  placeholder="ejemplo@vollmed.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  style={{ width: '100%', paddingLeft: '44px' }}
                  disabled={loading}
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '30px' }}>
              <label htmlFor="login-password">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <Lock 
                  size={18} 
                  style={{ 
                    position: 'absolute', 
                    left: '14px', 
                    top: '50%', 
                    transform: 'translateY(-50%)',
                    color: 'var(--text-muted)' 
                  }} 
                />
                <input
                  id="login-password"
                  type="password"
                  className="input-glass"
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  style={{ width: '100%', paddingLeft: '44px' }}
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>
              <div style={{ textAlign: 'right', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--color-primary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                  disabled={loading}
                >
                  ¿Olvidó su contraseña?
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit} autoComplete="off">
            {/* Dummy inputs to prevent autofill */}
            <input type="text" style={{ display: 'none' }} autoComplete="off" />
            <input type="password" style={{ display: 'none' }} autoComplete="new-password" />
            <div className="register-grid">
              
              <div className="form-group">
                <label htmlFor="reg-name">Nombre Completo</label>
                <div style={{ position: 'relative' }}>
                  <User 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '14px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)' 
                    }} 
                  />
                  <input
                    id="reg-name"
                    type="text"
                    className="input-glass"
                    placeholder="Ej. Dra. Julia Rodriguez"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    style={{ width: '100%', paddingLeft: '44px' }}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">Correo Electrónico</label>
                <div style={{ position: 'relative' }}>
                  <Mail 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '14px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)' 
                    }} 
                  />
                  <input
                    id="reg-email"
                    type="email"
                    className="input-glass"
                    placeholder="correo@vollmed.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    style={{ width: '100%', paddingLeft: '44px' }}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <Lock 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '14px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)' 
                    }} 
                  />
                  <input
                    id="reg-password"
                    type="password"
                    className="input-glass"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    style={{ width: '100%', paddingLeft: '44px' }}
                    disabled={loading}
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-phone">Teléfono</label>
                <div style={{ position: 'relative' }}>
                  <Phone 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '14px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)' 
                    }} 
                  />
                  <input
                    id="reg-phone"
                    type="text"
                    className="input-glass"
                    placeholder="+54 9 11 1234 5678"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    style={{ width: '100%', paddingLeft: '44px' }}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="reg-dni">Documento / DNI</label>
                <div style={{ position: 'relative' }}>
                  <CreditCard 
                    size={18} 
                    style={{ 
                      position: 'absolute', 
                      left: '14px', 
                      top: '50%', 
                      transform: 'translateY(-50%)',
                      color: 'var(--text-muted)' 
                    }} 
                  />
                  <input
                    id="reg-dni"
                    type="text"
                    className="input-glass"
                    placeholder="12345678"
                    value={regDni}
                    onChange={(e) => setRegDni(e.target.value)}
                    style={{ width: '100%', paddingLeft: '44px' }}
                    disabled={loading}
                    autoComplete="off"
                  />
                </div>
              </div>



            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: '100%' }}
              disabled={loading}
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>
        )}
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content glass-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Lock size={22} className="text-primary" />
                Recuperación
              </h2>
              <button className="close-btn" onClick={() => {
                setIsForgotModalOpen(false)
                setForgotStep(1)
              }}>
                <X size={20} />
              </button>
            </div>

            {forgotStep === 1 ? (
              <form onSubmit={handleRequestReset}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Introduce tu email registrado para recibir el token de restablecimiento de contraseña.
                </p>
                <div className="form-group">
                  <label htmlFor="forgot-email">Correo Electrónico</label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="input-glass"
                    placeholder="email@vollmed.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    disabled={forgotLoading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={forgotLoading}>
                  {forgotLoading ? 'Enviando...' : 'Enviar Token'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Introduce el token de verificación recibido y tu nueva contraseña.
                </p>
                <div className="form-group">
                  <label htmlFor="reset-token">Token de Recuperación</label>
                  <input
                    id="reset-token"
                    type="text"
                    className="input-glass"
                    placeholder="Introduce el token"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    disabled={forgotLoading}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reset-password">Nueva Contraseña</label>
                  <input
                    id="reset-password"
                    type="password"
                    className="input-glass"
                    placeholder="••••••••"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    disabled={forgotLoading}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={forgotLoading}>
                  {forgotLoading ? 'Restableciendo...' : 'Guardar Nueva Contraseña'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ width: '100%', marginTop: '10px' }}
                  onClick={() => setForgotStep(1)} 
                  disabled={forgotLoading}
                >
                  Volver a enviar token
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
