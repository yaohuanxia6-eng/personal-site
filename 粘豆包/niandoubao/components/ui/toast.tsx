'use client'

import { useState, useCallback, createContext, useContext } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const ToastContext = createContext<{
  show: (message: string, type?: Toast['type']) => void
}>({ show: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  let nextId = 0

  const show = useCallback((message: string, type: Toast['type'] = 'info') => {
    const id = ++nextId
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 2500)
  }, [])

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[999] flex flex-col gap-2 pointer-events-none max-w-[380px] w-full px-4">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-2.5 rounded-card text-body-sm font-medium text-center shadow-lg animate-bubble-in ${
              t.type === 'success' ? 'bg-accent text-white' :
              t.type === 'error' ? 'bg-crisis text-white' :
              'bg-surface text-text-primary border border-border'
            }`}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
