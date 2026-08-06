import { createContext, useCallback, useContext, useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '../utils/cn'

const ToastContext = createContext(null)

// ---------- Toast container (inline — small enough to live here) ----------

function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null

  const colorMap = {
    success: 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200',
    error: 'bg-rose-50 dark:bg-rose-900/40 border-rose-200 dark:border-rose-700 text-rose-800 dark:text-rose-200',
    info: 'bg-indigo-50 dark:bg-indigo-900/40 border-indigo-200 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200',
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-3 rounded-xl border px-4 py-3 text-sm shadow-lg min-w-[220px] animate-in',
            colorMap[t.type] || colorMap.info,
          )}
        >
          <span className="flex-1">{t.message}</span>
          <button onClick={() => onDismiss(t.id)} className="shrink-0 opacity-60 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

// ---------- Provider ----------

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const push = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, message, type }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4000)
  }, [])

  const toast = {
    success: (msg) => push(msg, 'success'),
    error: (msg) => push(msg, 'error'),
    info: (msg) => push(msg, 'info'),
  }

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}
