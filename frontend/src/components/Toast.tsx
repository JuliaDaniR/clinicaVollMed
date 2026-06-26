import { useToastStore } from '../store/toastStore'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

export default function Toast() {
  const { message, type } = useToastStore()

  if (!message) return null

  return (
    <div className={`toast toast-${type}`}>
      {type === 'success' ? (
        <CheckCircle2 size={20} className="text-success" />
      ) : (
        <AlertCircle size={20} className="text-danger" />
      )}
      <span>{message}</span>
    </div>
  )
}
