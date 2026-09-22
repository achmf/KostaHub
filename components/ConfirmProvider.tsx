'use client'

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createPortal } from 'react-dom'
import { palette, KostaButton } from '@/components/KostaUI'
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from 'lucide-react'

type ConfirmOptions = {
  title: string
  message: ReactNode
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'primary' | 'success'
  isAlert?: boolean
}

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
  alert: (options: Omit<ConfirmOptions, 'cancelText'>) => Promise<void>
}

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function useConfirm() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useConfirm must be used within ConfirmProvider')
  return { confirm: context.confirm }
}

export function useAlert() {
  const context = useContext(ConfirmContext)
  if (!context) throw new Error('useAlert must be used within ConfirmProvider')
  return { alert: context.alert }
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmOptions | null>(null)
  const [resolveFn, setResolveFn] = useState<(value: boolean) => void>()

  const confirm = (opts: ConfirmOptions) => {
    setOptions({ ...opts, isAlert: false })
    setIsOpen(true)
    return new Promise<boolean>((resolve) => {
      setResolveFn(() => resolve)
    })
  }

  const alert = (opts: Omit<ConfirmOptions, 'cancelText'>) => {
    setOptions({ ...opts, isAlert: true })
    setIsOpen(true)
    return new Promise<void>((resolve) => {
      setResolveFn(() => () => resolve())
    })
  }

  const handleClose = (value: boolean) => {
    setIsOpen(false)
    if (resolveFn) resolveFn(value)
  }

  return (
    <ConfirmContext.Provider value={{ confirm, alert }}>
      {children}
      <ConfirmDialog isOpen={isOpen} options={options} onClose={handleClose} />
    </ConfirmContext.Provider>
  )
}

function ConfirmDialog({ isOpen, options, onClose }: { isOpen: boolean, options: ConfirmOptions | null, onClose: (value: boolean) => void }) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  if (!mounted || !options) return null

  const getVariantStyles = () => {
    switch (options.variant) {
      case 'danger':
        return {
          icon: <AlertCircle size={24} style={{ color: palette.rose }} />,
          bg: 'rgba(181,68,59,0.1)',
          btnBg: palette.rose,
        }
      case 'warning':
        return {
          icon: <AlertTriangle size={24} style={{ color: palette.amber }} />,
          bg: 'rgba(217,162,60,0.1)',
          btnBg: palette.amber,
        }
      case 'success':
        return {
          icon: <CheckCircle2 size={24} style={{ color: palette.emerald }} />,
          bg: 'rgba(63,122,78,0.1)',
          btnBg: palette.emerald,
        }
      default:
        return {
          icon: <Info size={24} style={{ color: palette.moss }} />,
          bg: 'rgba(63,122,78,0.1)',
          btnBg: palette.ink,
        }
    }
  }

  const vs = getVariantStyles()

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
            style={{ background: 'rgba(13,20,15,0.45)', backdropFilter: 'blur(4px)' }}
            onClick={() => onClose(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-10 w-full max-w-sm bg-white rounded-[24px] shadow-2xl overflow-hidden flex flex-col"
            style={{ border: `1px solid ${palette.border}` }}
          >
            <div className="px-6 pt-7 pb-6 flex flex-col items-center text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center mb-5"
                style={{ background: vs.bg }}
              >
                {vs.icon}
              </div>
              <h2
                className="mb-2 tracking-[-0.025em]"
                style={{ fontFamily: "'Fraunces',serif", fontSize: 22, color: palette.ink, lineHeight: 1.2 }}
              >
                {options.title}
              </h2>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.65)', lineHeight: 1.5 }}>
                {options.message}
              </p>
            </div>
            <div className="p-4 flex gap-3" style={{ borderTop: `1px solid ${palette.border}`, background: 'rgba(13,20,15,0.02)' }}>
              {!options.isAlert && (
                <KostaButton
                  variant="ghost"
                  className="flex-1 justify-center"
                  onClick={() => onClose(false)}
                >
                  {options.cancelText || 'Batal'}
                </KostaButton>
              )}
              <button
                className="flex-1 rounded-full px-4 py-2.5 text-[13px] inline-flex items-center justify-center transition-transform active:scale-[0.97] hover:-translate-y-px cursor-pointer"
                style={{ fontFamily: "'Inter',sans-serif", background: vs.btnBg, color: palette.cream }}
                onClick={() => onClose(true)}
              >
                {options.confirmText || (options.isAlert ? 'Mengerti' : 'Konfirmasi')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}
