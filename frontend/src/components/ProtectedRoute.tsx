import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { AlertTriangle } from 'lucide-react'

interface ProtectedRouteProps {
  allowedRoles?: string[]
}

export default function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { accessToken, user } = useAuthStore()

  if (!accessToken) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && user) {
    const hasRole = user.roles.some((role) => allowedRoles.includes(role))
    if (!hasRole) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '16px',
          padding: '24px',
          textAlign: 'center'
        }}>
          <AlertTriangle size={48} style={{ color: 'var(--color-danger)' }} />
          <h1 style={{ fontFamily: 'var(--font-title)' }}>Acceso Denegado</h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
            No tienes los permisos necesarios para acceder a esta sección.
          </p>
          <Navigate to="/dashboard" replace />
        </div>
      )
    }
  }

  return <Outlet />
}
