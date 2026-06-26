import { useState, useEffect } from 'react'
import { X, Send, Mail, MessageSquare } from 'lucide-react'
import { useToastStore } from '../store/toastStore'

export interface VollmedMessage {
  id: string
  senderEmail: string
  senderName: string
  receiverEmail: string
  receiverName: string
  subject: string
  body: string
  timestamp: string
  leido: boolean
}

interface ContactModalProps {
  isOpen: boolean
  onClose: () => void
  recipientName: string
  recipientEmail: string
  senderName: string
  senderEmail: string
  defaultSubject?: string
  hideEmail?: boolean
}

export default function ContactModal({
  isOpen,
  onClose,
  recipientName,
  recipientEmail,
  senderName,
  senderEmail,
  defaultSubject = '',
  hideEmail = false
}: ContactModalProps) {
  const showToast = useToastStore(state => state.showToast)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  // Reset fields when opened
  useEffect(() => {
    if (isOpen) {
      setSubject(defaultSubject)
      setBody('')
    }
  }, [isOpen, defaultSubject])

  if (!isOpen) return null

  const handleSendEmail = () => {
    if (!subject.trim() || !body.trim()) {
      showToast('Por favor completa el asunto y el cuerpo del mensaje', 'error')
      return
    }

    const mailtoUrl = `mailto:${recipientEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`
    
    // Open default email client
    window.location.href = mailtoUrl
    showToast('Abriendo gestor de correo predeterminado...', 'success')
    onClose()
  }

  const handleSendInternal = () => {
    if (!subject.trim() || !body.trim()) {
      showToast('Por favor completa el asunto y el cuerpo del mensaje', 'error')
      return
    }

    setSending(true)
    try {
      const messagesRaw = localStorage.getItem('vollmed-messages')
      const messages: VollmedMessage[] = messagesRaw ? JSON.parse(messagesRaw) : []

      const newMessage: VollmedMessage = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        senderEmail,
        senderName: senderName || 'Usuario VollMed',
        receiverEmail: recipientEmail,
        receiverName: recipientName,
        subject,
        body,
        timestamp: new Date().toLocaleString(),
        leido: false
      }

      messages.unshift(newMessage)
      localStorage.setItem('vollmed-messages', JSON.stringify(messages))

      showToast('Mensaje interno enviado correctamente', 'success')
      onClose()
    } catch (e) {
      console.error(e)
      showToast('Error al enviar el mensaje interno', 'error')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content glass-card" style={{ maxWidth: '550px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <MessageSquare size={22} className="text-primary" />
            Enviar Mensaje
          </h2>
          <button className="close-btn" onClick={onClose} disabled={sending}>
            <X size={20} />
          </button>
        </div>

        <div style={{ padding: '0 0 10px 0', fontSize: '0.82rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-glass)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
            <strong>De:</strong> {senderName} <span style={{ fontFamily: 'monospace' }}>({senderEmail})</span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <strong>Para:</strong> {recipientName} {!hideEmail && <span style={{ fontFamily: 'monospace' }}>({recipientEmail})</span>}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="form-group">
            <label htmlFor="msg-subject">Asunto</label>
            <input
              id="msg-subject"
              type="text"
              className="input-glass"
              placeholder="Escribe el asunto del mensaje..."
              value={subject}
              onChange={e => setSubject(e.target.value)}
              disabled={sending}
              style={{ width: '100%' }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="msg-body">Mensaje</label>
            <textarea
              id="msg-body"
              className="input-glass"
              placeholder="Redacta tu mensaje aquí..."
              value={body}
              onChange={e => setBody(e.target.value)}
              disabled={sending}
              rows={5}
              style={{ 
                width: '100%', 
                resize: 'vertical', 
                background: 'var(--bg-obsidian-darker)',
                fontFamily: 'inherit',
                padding: '12px',
                fontSize: '0.9rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={onClose} 
              disabled={sending}
            >
              Cancelar
            </button>
            
            {!hideEmail && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                style={{ gap: '8px' }}
                onClick={handleSendEmail}
                disabled={sending}
              >
                <Mail size={16} />
                <span>Enviar por Email</span>
              </button>
            )}

            <button 
              type="button" 
              className="btn btn-primary" 
              style={{ gap: '8px' }}
              onClick={handleSendInternal}
              disabled={sending}
            >
              <Send size={16} />
              <span>{sending ? 'Enviando...' : 'Enviar Interno'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
