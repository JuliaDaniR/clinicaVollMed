import { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import { AlertTriangle } from 'lucide-react'
import { api } from '../services/api'

export default function SessionTimeoutWatcher() {
  const { accessToken, refreshToken, tokenExp, setTokens, clearAuth } = useAuthStore()
  const showToast = useToastStore((state) => state.showToast)
  const [showWarning, setShowWarning] = useState(false)
  const [countdown, setCountdown] = useState(30)
  const [renewing, setRenewing] = useState(false)

  useEffect(() => {
    if (!accessToken || !tokenExp) {
      setShowWarning(false)
      return
    }

    const checkInterval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000)
      const timeLeft = tokenExp - now

      // Show warning modal if less than 60 seconds left
      if (timeLeft > 0 && timeLeft <= 60) {
        if (!showWarning) {
          setShowWarning(true)
          setCountdown(Math.max(1, timeLeft))
        }
      } else if (timeLeft <= 0) {
        clearInterval(checkInterval)
        clearAuth()
      }
    }, 5000)

    return () => clearInterval(checkInterval)
  }, [accessToken, tokenExp, showWarning, clearAuth])

  // Countdown timer inside the modal (ticks every second)
  useEffect(() => {
    if (!showWarning) return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          clearAuth()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showWarning, clearAuth])

  const handleKeepWorking = async () => {
    if (!refreshToken) {
      showToast('No se encontró una sesión activa para renovar.', 'error')
      clearAuth()
      return
    }
    setRenewing(true)
    try {
      const response = await api.post('/auth/refresh', {
        refreshToken,
      })
      if (response.data && (response.data.status === 'success' || response.data.data)) {
        const { access_token, refresh_token } = response.data.data
        setTokens(access_token, refresh_token)
        setShowWarning(false)
        showToast('Sesión renovada correctamente.', 'success')
      } else {
        console.warn('Estructura de respuesta de renovación inválida:', response.data)
        showToast('Error al renovar la sesión: Respuesta inválida del servidor.', 'error')
        clearAuth()
      }
    } catch (e: any) {
      console.error('Failed to renew session', e)
      const errorMsg = e.response?.data?.message || 'Error de red o servidor al renovar la sesión.'
      showToast(`No se pudo renovar la sesión: ${errorMsg}`, 'error')
      clearAuth()
    } finally {
      setRenewing(false)
    }
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken })
      }
    } catch (e) {
      console.error('Error logging out during timeout warning', e)
    } finally {
      clearAuth()
      setShowWarning(false)
    }
  }

  if (!showWarning) return null

  return (
    <div className="modal-overlay" style={{ zIndex: 9999 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <AlertTriangle size={48} className="text-warning" style={{ color: 'var(--color-warning)' }} />
        </div>
        <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontFamily: 'var(--font-title)' }}>
          ¡Tu sesión está por caducar!
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
          Por inactividad o expiración de seguridad, tu sesión finalizará automáticamente en{' '}
          <strong style={{ color: 'var(--color-warning)' }}>{countdown} segundos</strong>. ¿Deseas seguir trabajando?
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleLogout}
            disabled={renewing}
            style={{ flex: 1 }}
          >
            Cerrar Sesión
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={handleKeepWorking}
            disabled={renewing}
            style={{ flex: 1 }}
          >
            {renewing ? 'Renovando...' : 'Seguir Trabajando'}
          </button>
        </div>
      </div>
    </div>
  )
}
