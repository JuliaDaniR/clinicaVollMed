import { useState, useEffect } from 'react'
import { 
  Mail, 
  Send, 
  Trash2, 
  Reply, 
  Inbox, 
  User, 
  Clock, 
  MessageSquare,
  AlertCircle
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useToastStore } from '../store/toastStore'
import ContactModal, { type VollmedMessage } from '../components/ContactModal'
import { api } from '../services/api'

export default function Mensajes() {
  const { user } = useAuthStore()
  const showToast = useToastStore(state => state.showToast)
  
  const [messages, setMessages] = useState<VollmedMessage[]>([])
  const [activeTab, setActiveTab] = useState<'recibidos' | 'enviados'>('recibidos')
  const [selectedMessage, setSelectedMessage] = useState<VollmedMessage | null>(null)
  
  // User name lookup (to set as senderName)
  const [userProfileName, setUserProfileName] = useState('')

  // Contact Modal state for replying
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [contactRecipientName, setContactRecipientName] = useState('')
  const [contactRecipientEmail, setContactRecipientEmail] = useState('')
  const [replySubject, setReplySubject] = useState('')

  // Custom Confirmation Modal State
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmAction, setConfirmAction] = useState<() => void>(() => {})

  const requestConfirmation = (message: string, action: () => void) => {
    setConfirmMessage(message)
    setConfirmAction(() => action)
    setIsConfirmOpen(true)
  }

  const loadMessages = () => {
    const raw = localStorage.getItem('vollmed-messages')
    if (raw) {
      setMessages(JSON.parse(raw))
    } else {
      setMessages([])
    }
  }

  const fetchUserProfile = async () => {
    if (!user) return
    try {
      const isDoc = user.roles.includes('ROLE_MEDICO')
      const isPat = user.roles.includes('ROLE_PACIENTE')
      
      if (isDoc) {
        const res = await api.get('/medicos?page=0&size=100')
        const matched = res.data.data.content?.find((m: any) => m.email === user.email)
        if (matched) setUserProfileName(matched.nombre)
      } else if (isPat) {
        const res = await api.get('/pacientes?page=0&size=100')
        const matched = res.data.data.content?.find((p: any) => p.email === user.email)
        if (matched) setUserProfileName(matched.nombre)
      } else if (user.roles.includes('ROLE_ADMIN')) {
        setUserProfileName('Administrador')
      } else if (user.roles.includes('ROLE_RECEPCIONISTA')) {
        setUserProfileName('Recepcionista')
      }
    } catch (e) {
      console.error('Error loading profile name for messaging', e)
    }
  }

  useEffect(() => {
    loadMessages()
    fetchUserProfile()

    // Sincronización cruzada entre pestañas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vollmed-messages') {
        loadMessages()
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [user])

  const handleSelectMessage = (msg: VollmedMessage) => {
    setSelectedMessage(msg)
    
    // Si el mensaje es recibido y no está leído, marcarlo como leído
    if (msg.receiverEmail === user?.email && !msg.leido) {
      const updated = messages.map(m => m.id === msg.id ? { ...m, leido: true } : m)
      localStorage.setItem('vollmed-messages', JSON.stringify(updated))
      setMessages(updated)
      
      // Emitir evento de almacenamiento local para actualizar el Sidebar de inmediato
      window.dispatchEvent(new Event('storage'))
    }
  }

  const handleDeleteMessage = (msgId: string) => {
    requestConfirmation(
      '¿Estás seguro de que deseas eliminar este mensaje?',
      () => {
        const updated = messages.filter(m => m.id !== msgId)
        localStorage.setItem('vollmed-messages', JSON.stringify(updated))
        setMessages(updated)
        setSelectedMessage(null)
        showToast('Mensaje eliminado', 'success')
        
        // Emitir evento de almacenamiento local
        window.dispatchEvent(new Event('storage'))
      }
    )
  }

  const handleClearTabMessages = () => {
    const tabName = activeTab === 'recibidos' ? 'Recibidos' : 'Enviados'
    requestConfirmation(
      `¿Estás seguro de que deseas eliminar TODOS los mensajes de la bandeja de ${tabName}? Esta acción no se puede deshacer.`,
      () => {
        const updated = messages.filter(msg => {
          if (activeTab === 'recibidos') {
            return msg.receiverEmail !== user?.email
          } else {
            return msg.senderEmail !== user?.email
          }
        })
        localStorage.setItem('vollmed-messages', JSON.stringify(updated))
        setMessages(updated)
        setSelectedMessage(null)
        showToast('Bandeja de mensajes vaciada', 'success')
        
        // Emitir evento de almacenamiento local
        window.dispatchEvent(new Event('storage'))
      }
    )
  }

  const filteredMessages = messages.filter(msg => {
    if (activeTab === 'recibidos') {
      return msg.receiverEmail === user?.email
    } else {
      return msg.senderEmail === user?.email
    }
  })

  return (
    <>
      <div className="header-actions">
        <div>
          <h1 className="page-title">Centro de Mensajería</h1>
          <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>
            Comunícate de forma segura con los profesionales y pacientes de VollMed.
          </p>
        </div>
        {filteredMessages.length > 0 && (
          <button
            className="btn btn-danger"
            style={{ padding: '10px 18px', fontSize: '0.85rem', gap: '8px' }}
            onClick={handleClearTabMessages}
          >
            <Trash2 size={16} />
            <span>Vaciar {activeTab === 'recibidos' ? 'Recibidos' : 'Enviados'}</span>
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '30px', alignItems: 'stretch' }}>
        
        {/* Panel Izquierdo: Lista de Mensajes y Filtros */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          
          {/* Tabs Selector */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-glass)' }}>
            <button
              onClick={() => {
                setActiveTab('recibidos')
                setSelectedMessage(null)
              }}
              style={{
                flex: 1,
                padding: '16px',
                background: activeTab === 'recibidos' ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'recibidos' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'recibidos' ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Inbox size={16} />
              <span>Recibidos</span>
              {messages.filter(m => m.receiverEmail === user?.email && !m.leido).length > 0 && (
                <span style={{
                  background: 'var(--color-danger)',
                  color: 'white',
                  fontSize: '0.72rem',
                  padding: '2px 6px',
                  borderRadius: '10px',
                  fontWeight: '700'
                }}>
                  {messages.filter(m => m.receiverEmail === user?.email && !m.leido).length}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                setActiveTab('enviados')
                setSelectedMessage(null)
              }}
              style={{
                flex: 1,
                padding: '16px',
                background: activeTab === 'enviados' ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: 'none',
                borderBottom: activeTab === 'enviados' ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === 'enviados' ? 'var(--color-primary)' : 'var(--text-muted)',
                fontWeight: '600',
                fontSize: '0.9rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <Send size={16} />
              <span>Enviados</span>
            </button>
          </div>

          {/* List content */}
          <div style={{ flexGrow: 1, padding: '12px' }}>
            {filteredMessages.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Mail size={24} style={{ color: 'var(--border-glass-hover)' }} />
                <span style={{ fontSize: '0.85rem' }}>No hay mensajes en esta bandeja.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {filteredMessages.map(msg => {
                  const isUnread = activeTab === 'recibidos' && !msg.leido
                  const isSelected = selectedMessage?.id === msg.id

                  return (
                    <div
                      key={msg.id}
                      onClick={() => handleSelectMessage(msg)}
                      style={{
                        padding: '12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: 'pointer',
                        background: isSelected 
                          ? 'rgba(255, 255, 255, 0.05)' 
                          : isUnread 
                            ? 'rgba(20, 184, 166, 0.03)' 
                            : 'rgba(255, 255, 255, 0.01)',
                        border: isSelected 
                          ? '1px solid var(--color-primary)' 
                          : isUnread 
                            ? '1px solid rgba(20, 184, 166, 0.2)' 
                            : '1px solid var(--border-glass)',
                        transition: 'all 0.2s ease',
                        position: 'relative'
                      }}
                    >
                      {/* Unread dot indicator */}
                      {isUnread && (
                        <div style={{
                          position: 'absolute',
                          top: '12px',
                          right: '12px',
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: 'var(--color-primary)',
                          boxShadow: '0 0 8px var(--color-primary)'
                        }} />
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '4px', paddingRight: isUnread ? '12px' : '0' }}>
                        <span style={{ fontWeight: isUnread ? '700' : 'normal', color: isUnread ? 'var(--color-primary)' : 'var(--text-muted)' }}>
                          {activeTab === 'recibidos' ? msg.senderName : `Para: ${msg.receiverName}`}
                        </span>
                      </div>
                      
                      <div style={{
                        fontSize: '0.85rem',
                        fontWeight: isUnread ? '700' : '600',
                        color: 'var(--text-main)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        marginBottom: '2px'
                      }}>
                        {msg.subject}
                      </div>

                      <div style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        {msg.body}
                      </div>

                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textAlign: 'right', marginTop: '6px' }}>
                        {msg.timestamp.split(' ')[0]}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panel Derecho: Visor de Mensajes */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          {selectedMessage ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              
              {/* Header Info */}
              <div style={{ padding: '24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)', fontFamily: 'var(--font-title)' }}>
                    {selectedMessage.subject}
                  </h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} className="text-secondary" />
                      <span><strong>De:</strong> {selectedMessage.senderName} ({selectedMessage.senderEmail})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={14} className="text-secondary" />
                      <span><strong>Para:</strong> {selectedMessage.receiverName} ({selectedMessage.receiverEmail})</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Clock size={14} className="text-secondary" />
                      <span>{selectedMessage.timestamp}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  {activeTab === 'recibidos' && (
                    <button
                      className="btn btn-primary"
                      style={{ padding: '8px 16px', fontSize: '0.8rem', gap: '6px' }}
                      onClick={() => {
                        setContactRecipientName(selectedMessage.senderName)
                        setContactRecipientEmail(selectedMessage.senderEmail)
                        setReplySubject(`Re: ${selectedMessage.subject}`)
                        setIsContactOpen(true)
                      }}
                    >
                      <Reply size={14} />
                      <span>Responder</span>
                    </button>
                  )}
                  <button
                    className="btn btn-danger"
                    style={{ padding: '8px 16px', fontSize: '0.8rem', gap: '6px' }}
                    onClick={() => handleDeleteMessage(selectedMessage.id)}
                  >
                    <Trash2 size={14} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>

              {/* Message Body */}
              <div style={{ flexGrow: 1, padding: '24px', background: 'rgba(255,255,255,0.01)', lineBreak: 'anywhere' }}>
                <p style={{ 
                  fontSize: '0.95rem', 
                  color: 'var(--text-main)', 
                  lineHeight: '1.6', 
                  whiteSpace: 'pre-line' 
                }}>
                  {selectedMessage.body}
                </p>
              </div>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: '16px', color: 'var(--text-muted)', padding: '40px' }}>
              <MessageSquare size={48} style={{ color: 'var(--border-glass-hover)', opacity: 0.5 }} />
              <div style={{ textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-main)', marginBottom: '4px' }}>Visualizador de Mensajes</h3>
                <p style={{ fontSize: '0.85rem' }}>Selecciona un mensaje de la bandeja de entrada o enviados para leer su contenido.</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Modal de Envío de Mensaje */}
      {selectedMessage && (
        <ContactModal
          isOpen={isContactOpen}
          onClose={() => setIsContactOpen(false)}
          recipientName={contactRecipientName}
          recipientEmail={contactRecipientEmail}
          senderName={userProfileName || 'Usuario VollMed'}
          senderEmail={user?.email || ''}
          defaultSubject={replySubject}
          hideEmail={user?.roles.includes('ROLE_PACIENTE')}
        />
      )}

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
