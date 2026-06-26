import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { api } from '../services/api'
import { 
  Activity, 
  LayoutDashboard, 
  Stethoscope, 
  Users, 
  CalendarDays, 
  LogOut,
  User,
  Clock,
  ClipboardList,
  Shield,
  Mail
} from 'lucide-react'

export default function Sidebar() {
  const { user, refreshToken, clearAuth } = useAuthStore()
  const navigate = useNavigate()

  const [messages, setMessages] = useState<any[]>([])

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
    const handleStorageChange = () => {
      loadMessages()
    }
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('local-messages-updated', handleStorageChange)
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('local-messages-updated', handleStorageChange)
    }
  }, [])

  const unreadCount = messages.filter(m => m.receiverEmail === user?.email && !m.leido).length

  // Theme State
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('vollmed-theme') || 'default'
  })

  useEffect(() => {
    if (theme === 'default') {
      document.body.removeAttribute('data-theme')
    } else {
      document.body.setAttribute('data-theme', theme)
    }
  }, [theme])

  const changeTheme = (newTheme: string) => {
    setTheme(newTheme)
    localStorage.setItem('vollmed-theme', newTheme)
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch (e) {
      console.error('Error logging out from server', e)
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  const hasRole = (roles: string[]) => {
    return user?.roles.some(r => roles.includes(r)) || false
  }

  return (
    <aside className="sidebar">
      <div>
        <div className="logo-container">
          <Activity size={28} className="logo-icon" />
          <span className="logo-text">VollMed</span>
        </div>

        <nav className="sidebar-menu">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </NavLink>

          <NavLink 
            to="/mensajes" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Mail size={20} />
                <span>Mensajes</span>
              </div>
              {unreadCount > 0 && (
                <span style={{
                  background: 'var(--color-danger)',
                  color: 'white',
                  fontSize: '0.72rem',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontWeight: '750',
                  lineHeight: '1',
                  boxShadow: '0 0 8px rgba(239, 68, 68, 0.4)'
                }}>
                  {unreadCount}
                </span>
              )}
            </div>
          </NavLink>

          {hasRole(['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_MEDICO']) && (
            <NavLink 
              to="/medicos" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <Stethoscope size={20} />
              <span>Médicos</span>
            </NavLink>
          )}

          {hasRole(['ROLE_ADMIN', 'ROLE_RECEPCIONISTA']) && (
            <NavLink 
              to="/pacientes" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>Pacientes</span>
            </NavLink>
          )}

          {hasRole(['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_PACIENTE']) && (
            <NavLink 
              to="/consultas" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <CalendarDays size={20} />
              <span>Consultas</span>
            </NavLink>
          )}

          {hasRole(['ROLE_PACIENTE']) && (
            <NavLink 
              to="/mi-familia" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <Users size={20} />
              <span>Mi Familia</span>
            </NavLink>
          )}

          {hasRole(['ROLE_MEDICO']) && (
            <NavLink 
              to="/mi-agenda" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <Clock size={20} />
              <span>Mi Agenda</span>
            </NavLink>
          )}

          {hasRole(['ROLE_ADMIN', 'ROLE_MEDICO']) && (
            <NavLink 
              to="/historia-clinica" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <ClipboardList size={20} />
              <span>Historial Clínico</span>
            </NavLink>
          )}

          {hasRole(['ROLE_ADMIN']) && (
            <NavLink 
              to="/administracion" 
              className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
            >
              <Shield size={20} />
              <span>Administración</span>
            </NavLink>
          )}

          <NavLink 
            to="/mi-perfil" 
            className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}
          >
            <User size={20} />
            <span>Mi Cuenta</span>
          </NavLink>
        </nav>

      {/* Theme Switcher in Sidebar */}
      <div className="theme-switcher-sidebar" style={{
        padding: '16px 10px 10px 10px',
        borderTop: '1px solid var(--border-glass)',
        marginTop: 'auto',
        marginBottom: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px'
      }}>
        <span style={{ 
          fontSize: '0.7rem', 
          color: 'var(--text-muted)', 
          fontWeight: '700', 
          fontFamily: 'var(--font-title)',
          letterSpacing: '0.05em' 
        }}>
          🎨 TEMA ACTIVO
        </span>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Option: Salvia */}
          <button 
            type="button" 
            title="Verde Salvia"
            onClick={() => changeTheme('salvia')} 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: '#6B9080', 
              border: theme === 'salvia' ? '2px solid var(--text-main)' : '1px solid var(--border-glass)', 
              boxShadow: theme === 'salvia' ? '0 0 10px rgba(107, 144, 128, 0.6)' : 'none',
              cursor: 'pointer',
              outline: 'none',
              transition: 'var(--transition-smooth)'
            }}
          />

          {/* Option: Morado */}
          <button 
            type="button" 
            title="Morado Cyber"
            onClick={() => changeTheme('morado')} 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: '#6D5BD0', 
              border: theme === 'morado' ? '2px solid var(--text-main)' : '1px solid var(--border-glass)', 
              boxShadow: theme === 'morado' ? '0 0 10px rgba(109, 91, 208, 0.6)' : 'none',
              cursor: 'pointer',
              outline: 'none',
              transition: 'var(--transition-smooth)'
            }}
          />

          {/* Option: Terracota */}
          <button 
            type="button" 
            title="Terracota Cálido"
            onClick={() => changeTheme('terracota')} 
            style={{ 
              width: '32px', 
              height: '32px', 
              borderRadius: '50%', 
              background: '#C97B63', 
              border: theme === 'terracota' ? '2px solid var(--text-main)' : '1px solid var(--border-glass)', 
              boxShadow: theme === 'terracota' ? '0 0 10px rgba(201, 123, 99, 0.6)' : 'none',
              cursor: 'pointer',
              outline: 'none',
              transition: 'var(--transition-smooth)'
            }}
          />
        </div>
      </div>
      </div>

      <div className="user-profile-widget">
        <div className="user-info">
          <span className="user-name" title={user?.email}>
            {user?.email ? user.email.split('@')[0] : 'Usuario'}
          </span>
          <span className="user-role">
            {user?.roles[0]?.replace('ROLE_', '') || 'Usuario'}
          </span>
        </div>
        <button className="close-btn" onClick={handleLogout} title="Cerrar Sesión">
          <LogOut size={20} />
        </button>
      </div>
    </aside>
  )
}
