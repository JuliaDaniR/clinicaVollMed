import React, { useState, useEffect } from 'react'
import { api } from '../services/api'
import { useToastStore } from '../store/toastStore'
import { 
  Shield, 
  UserCheck, 
  UserX, 
  KeyRound, 
  HelpCircle,
  ArrowRight,
  Search,
  User,
  AlertCircle
} from 'lucide-react'

interface UserListItem {
  id: number
  nombre: string
  email: string
  rol: string
  activo: boolean
  dni: string
}

export default function Administracion() {
  const showToast = useToastStore(state => state.showToast)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(true)

  // Users directory state
  const [users, setUsers] = useState<UserListItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  // Selected user
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedRole, setSelectedRole] = useState('RECEPCIONISTA')

  // Custom Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {})

  const requestConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message)
    setConfirmAction(() => action)
    setIsConfirmOpen(true)
  }

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get('/usuario')
      setUsers(response.data || [])
    } catch (err: any) {
      console.error('Error fetching users', err)
      showToast('Error al cargar la lista de usuarios', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const selectedUser = users.find(u => u.id === selectedUserId)

  // Keep selected role dropdown in sync with selected user's role
  useEffect(() => {
    if (selectedUser) {
      setSelectedRole(selectedUser.rol)
    }
  }, [selectedUserId, users])

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserId || !selectedUser) {
      showToast('Por favor selecciona un usuario del listado', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.patch(`/usuario/${selectedUserId}/rol`, {
        rol: selectedRole
      })
      if (response.data.success) {
        showToast(`Rol del usuario actualizado a ${selectedRole} correctamente`, 'success')
        await fetchUsers()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al actualizar el rol del usuario'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeactivateUser = () => {
    if (!selectedUserId || !selectedUser) {
      showToast('Por favor selecciona un usuario del listado', 'error')
      return
    }

    requestConfirmation(
      `¿Estás seguro de que deseas desactivar la cuenta de ${selectedUser.nombre}?`,
      async () => {
        setSubmitting(true)
        try {
          const response = await api.delete(`/usuario/${selectedUserId}`)
          if (response.data.success) {
            showToast('Usuario desactivado correctamente', 'success')
            await fetchUsers()
          }
        } catch (err: any) {
          console.error(err)
          const msg = err.response?.data?.message || 'Error al desactivar el usuario'
          showToast(msg, 'error')
        } finally {
          setSubmitting(false)
        }
      }
    )
  }

  const handleActivateUser = async () => {
    if (!selectedUserId || !selectedUser) {
      showToast('Por favor selecciona un usuario del listado', 'error')
      return
    }

    setSubmitting(true)
    try {
      const response = await api.patch(`/usuario/${selectedUserId}`)
      if (response.data.success) {
        showToast('Usuario reactivado correctamente', 'success')
        await fetchUsers()
      }
    } catch (err: any) {
      console.error(err)
      const msg = err.response?.data?.message || 'Error al activar el usuario'
      showToast(msg, 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredUsers = users.filter(u => {
    const term = searchTerm.toLowerCase()
    return (
      (u.nombre && u.nombre.toLowerCase().includes(term)) ||
      (u.email && u.email.toLowerCase().includes(term)) ||
      (u.dni && u.dni.toLowerCase().includes(term)) ||
      (u.rol && u.rol.toLowerCase().includes(term))
    )
  })

  return (
    <>
      <div className="header-actions">
        <div>
          <h1 className="page-title">Consola de Administración</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Panel exclusivo para administradores del sistema. Gestiona permisos, roles y estados de cuenta global.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '30px', alignItems: 'start' }}>
        
        {/* Panel de Gestión de Cuentas */}
        <div className="glass-card" style={{ padding: '30px' }}>
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Shield className="text-primary" size={22} />
            Gestión de Cuenta
          </h2>

          {!selectedUser ? (
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              padding: '40px 20px', 
              textAlign: 'center', 
              gap: '16px', 
              background: 'rgba(255,255,255,0.01)', 
              borderRadius: 'var(--radius-md)', 
              border: '1px dashed var(--border-glass)' 
            }}>
              <AlertCircle size={40} style={{ color: 'var(--text-muted)' }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '1.05rem', color: 'var(--text-main)' }}>Ningún usuario seleccionado</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: '1.4' }}>
                  Selecciona una cuenta en el directorio de la derecha para administrar sus permisos, cambiar su rol o alternar su estado de activación.
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Información del Usuario Seleccionado */}
              <div style={{ 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px solid var(--border-glass)', 
                borderRadius: 'var(--radius-md)', 
                padding: '16px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div style={{ 
                  width: '40px', 
                  height: '40px', 
                  borderRadius: '50%', 
                  background: 'var(--color-primary)', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  color: 'var(--bg-obsidian-darker)'
                }}>
                  <User size={20} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: '600', color: 'var(--text-main)', fontSize: '1.1rem' }}>
                    {selectedUser.nombre || 'Sin nombre'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '2px' }}>
                    <span>{selectedUser.email}</span>
                    <span>•</span>
                    <span>DNI: {selectedUser.dni || 'N/D'}</span>
                    <span>•</span>
                    <span>ID: {selectedUser.id}</span>
                  </div>
                </div>
                <div>
                  <span className={`badge ${selectedUser.activo ? 'badge-success' : 'badge-danger'}`}>
                    {selectedUser.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
              </div>

              {/* Botones de Activación */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '30px' }}>
                <button 
                  type="button" 
                  className="btn btn-danger" 
                  style={{ flex: 1 }}
                  onClick={handleDeactivateUser}
                  disabled={submitting || !selectedUser.activo}
                >
                  <UserX size={16} />
                  <span>Desactivar Cuenta</span>
                </button>

                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  style={{ flex: 1, borderColor: 'var(--color-success)', color: 'var(--color-success)' }}
                  onClick={handleActivateUser}
                  disabled={submitting || selectedUser.activo}
                >
                  <UserCheck size={16} />
                  <span>Reactivar Cuenta</span>
                </button>
              </div>

              {/* Formulario de Cambio de Rol */}
              <form onSubmit={handleUpdateRole} style={{ borderTop: '1px solid var(--border-glass)', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--color-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <KeyRound size={18} />
                  Cambio de Rol y Permisos
                </h3>

                <div className="form-group">
                  <label htmlFor="adm-rol">Seleccionar Rol del Sistema</label>
                  <select
                    id="adm-rol"
                    className="input-glass"
                    value={selectedRole}
                    onChange={e => setSelectedRole(e.target.value)}
                    style={{ background: 'var(--bg-obsidian-darker)', width: '100%' }}
                    disabled={submitting}
                  >
                    <option value="ADMIN">Administrador (ADMIN)</option>
                    <option value="RECEPCIONISTA">Recepcionista (RECEPCIONISTA)</option>
                    <option value="MEDICO">Médico (MEDICO)</option>
                    <option value="PACIENTE">Paciente (PACIENTE)</option>
                  </select>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', marginTop: '10px' }}
                  disabled={submitting || selectedUser.rol === selectedRole}
                >
                  <span>Aplicar Nuevo Rol</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Panel de Directorio de Usuarios */}
        <div className="glass-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.4rem', borderBottom: '1px solid var(--border-glass)', paddingBottom: '10px', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <HelpCircle className="text-secondary" size={22} />
            Directorio de Cuentas
          </h2>

          {/* Campo de búsqueda */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <div style={{ position: 'relative' }}>
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
              <input
                type="text"
                className="input-glass"
                placeholder="Buscar por nombre, email, DNI o rol..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ width: '100%', paddingLeft: '44px' }}
              />
            </div>
          </div>

          {/* Listado */}
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '10px' 
          }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                Cargando directorio de usuarios...
              </div>
            ) : filteredUsers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                No se encontraron usuarios.
              </div>
            ) : (
              filteredUsers.map(u => {
                const isSelected = u.id === selectedUserId
                return (
                  <div 
                    key={u.id}
                    onClick={() => setSelectedUserId(u.id)}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 'var(--radius-md)',
                      background: isSelected ? 'rgba(107, 144, 128, 0.15)' : 'rgba(255,255,255,0.02)',
                      border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--border-glass)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'var(--transition-smooth)',
                    }}
                    onMouseEnter={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                        e.currentTarget.style.borderColor = 'var(--border-glass-hover)'
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isSelected) {
                        e.currentTarget.style.background = 'rgba(255,255,255,0.02)'
                        e.currentTarget.style.borderColor = 'var(--border-glass)'
                      }
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                        {u.nombre || 'Sin nombre'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {u.email} {u.dni ? `• DNI: ${u.dni}` : ''}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span className={`badge ${u.activo ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.75rem' }}>
                        {u.activo ? 'Activo' : 'Inactivo'}
                      </span>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          padding: '3px 8px', 
                          borderRadius: '10px',
                          fontWeight: '600',
                          background: u.rol === 'ADMIN' ? 'rgba(109, 91, 208, 0.2)' 
                                    : u.rol === 'MEDICO' ? 'rgba(6, 182, 212, 0.2)' 
                                    : u.rol === 'RECEPCIONISTA' ? 'rgba(245, 158, 11, 0.2)' 
                                    : 'rgba(59, 130, 246, 0.2)',
                          color: u.rol === 'ADMIN' ? 'var(--color-secondary)' 
                               : u.rol === 'MEDICO' ? 'var(--color-secondary)'
                               : u.rol === 'RECEPCIONISTA' ? 'var(--color-warning)' 
                               : '#3b82f6',
                          border: u.rol === 'ADMIN' ? '1px solid rgba(109, 91, 208, 0.4)' 
                                : u.rol === 'MEDICO' ? '1px solid rgba(6, 182, 212, 0.4)' 
                                : u.rol === 'RECEPCIONISTA' ? '1px solid rgba(245, 158, 11, 0.4)' 
                                : '1px solid rgba(59, 130, 246, 0.4)',
                        }}
                      >
                        {u.rol}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

      </div>

      {/* Custom Confirmation Modal */}
      {isConfirmOpen && (
        <div className="modal-overlay" style={{ zIndex: 9999 }}>
          <div className="modal-content glass-card" style={{ maxWidth: '400px', textAlign: 'center', padding: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <AlertCircle size={48} className="text-warning" style={{ color: 'var(--color-danger)' }} />
            </div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '12px', fontFamily: 'var(--font-title)' }}>
              Confirmar Acción
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: '1.5' }}>
              {confirmMessage}
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setIsConfirmOpen(false)}
                style={{ flex: 1 }}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={() => {
                  setIsConfirmOpen(false)
                  confirmAction()
                }}
                style={{ flex: 1 }}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
