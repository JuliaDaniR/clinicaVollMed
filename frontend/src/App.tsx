import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Toast from './components/Toast'
import SessionTimeoutWatcher from './components/SessionTimeoutWatcher'
import Dashboard from './pages/Dashboard'
import Medicos from './pages/Medicos'
import Pacientes from './pages/Pacientes'
import Consultas from './pages/Consultas'
import MiPerfil from './pages/MiPerfil'
import MiAgenda from './pages/MiAgenda'
import HistoriaClinicaPage from './pages/HistoriaClinicaPage'
import Administracion from './pages/Administracion'
import Landing from './pages/Landing'
import Mensajes from './pages/Mensajes'
import MiFamilia from './pages/MiFamilia'
import { useAuthStore } from './store/authStore'

function DashboardLayout() {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/mi-perfil" element={<MiPerfil />} />
          <Route path="/mensajes" element={<Mensajes />} />

          {/* Shared pages with specific roles */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_MEDICO']} />}>
            <Route path="/medicos" element={<Medicos />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_RECEPCIONISTA']} />}>
            <Route path="/pacientes" element={<Pacientes />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_RECEPCIONISTA', 'ROLE_PACIENTE']} />}>
            <Route path="/consultas" element={<Consultas />} />
          </Route>

          {/* Medico Only */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_MEDICO']} />}>
            <Route path="/mi-agenda" element={<MiAgenda />} />
          </Route>

          {/* Clinical Workstation (Admin, Medico) */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN', 'ROLE_MEDICO']} />}>
            <Route path="/historia-clinica" element={<HistoriaClinicaPage />} />
          </Route>

          {/* Admin Only */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_ADMIN']} />}>
            <Route path="/administracion" element={<Administracion />} />
          </Route>

          {/* Paciente Only */}
          <Route element={<ProtectedRoute allowedRoles={['ROLE_PACIENTE']} />}>
            <Route path="/mi-familia" element={<MiFamilia />} />
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <footer style={{ 
          marginTop: 'auto', 
          paddingTop: '20px', 
          borderTop: '1px solid var(--border-glass)', 
          color: 'var(--text-muted)', 
          fontSize: '0.8rem', 
          textAlign: 'center' 
        }}>
          &copy; {new Date().getFullYear()} VollMed. Todos los derechos reservados. Sistema de administración clínica integral.
        </footer>
      </main>
    </div>
  )
}

export default function App() {
  const { accessToken } = useAuthStore()

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={accessToken ? <Navigate to="/dashboard" replace /> : <Landing />} 
        />
        <Route 
          path="/login" 
          element={<Navigate to="/?auth=login" replace />} 
        />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/*" element={<DashboardLayout />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toast />
      <SessionTimeoutWatcher />
    </Router>
  )
}
