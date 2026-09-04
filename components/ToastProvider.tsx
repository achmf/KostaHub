'use client'

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { palette } from '@/components/KostaUI'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info'

interface ToastOptions {
  id?: string
  title: string
  message?: string
  type?: ToastType
  duration?: number
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastOptions[]>([])

  const showToast = useCallback((options: ToastOptions) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast = { ...options, id, type: options.type || 'info', duration: options.duration || 4000 }
    
    setToasts((prev) => [...prev, newToast])

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, newToast.duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }: { toasts: ToastOptions[], removeToast: (id: string) => void }) {
  const [mounted, setMounted] = useState(false)
  React.useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return createPortal(
    <div className="fixed top-6 right-6 z-[999999] flex flex-col gap-3 pointer-events-none w-full max-w-[320px]">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id!} toast={toast} removeToast={removeToast} />
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}

function ToastItem({ toast, removeToast }: { toast: ToastOptions, removeToast: (id: string) => void }) {
  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return { icon: <CheckCircle2 size={20} style={{ color: palette.emerald }} />, bg: palette.emerald }
      case 'error':
        return { icon: <AlertCircle size={20} style={{ color: palette.rose }} />, bg: palette.rose }
      default:
        return { icon: <Info size={20} style={{ color: palette.ink }} />, bg: palette.ink }
    }
  }

  const styles = getStyles()

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className="pointer-events-auto bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex overflow-hidden"
      style={{ border: `1px solid ${palette.border}` }}
    >
      <div className="w-1.5 shrink-0" style={{ background: styles.bg }} />
      <div className="p-4 flex gap-3 flex-1 items-start">
        <div className="mt-0.5 shrink-0">{styles.icon}</div>
        <div className="flex-1 pr-2">
          <h4 className="font-medium" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.ink, lineHeight: 1.3 }}>
            {toast.title}
          </h4>
          {toast.message && (
            <p className="mt-1" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.65)', lineHeight: 1.4 }}>
              {toast.message}
            </p>
          )}
        </div>
        <button
          onClick={() => removeToast(toast.id!)}
          className="shrink-0 p-1 opacity-40 hover:opacity-100 transition-opacity rounded-md hover:bg-black/5 cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>
    </motion.div>
  )
}
