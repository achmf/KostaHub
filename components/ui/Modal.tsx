'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './button'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  maxWidth?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

const MAX_W: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

export function Modal({ open, onClose, title, description, maxWidth = 'md', children }: ModalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 6 }}
            transition={{ type: 'spring' as const, stiffness: 420, damping: 32 }}
            className={`bg-[#FDFCF7] rounded-2xl shadow-[0_20px_40px_-15px_rgba(13,20,15,0.2)] border border-[rgba(13,20,15,0.06)] w-full overflow-hidden ${MAX_W[maxWidth]}`}
          >
            {/* Header */}
            <div className="flex justify-between items-start px-6 py-5 border-b border-[rgba(13,20,15,0.06)] bg-[#FDFCF7]">
              <div>
                <h2 className="text-xl font-medium tracking-tight" style={{ fontFamily: "'Fraunces',serif", color: '#0D140F' }}>
                  {title}
                </h2>
                {description && (
                  <p className="text-[13px] mt-1" style={{ fontFamily: "'Inter',sans-serif", color: 'rgba(13,20,15,0.55)' }}>
                    {description}
                  </p>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup" className="ml-4 shrink-0 text-[rgba(13,20,15,0.5)] hover:bg-[rgba(13,20,15,0.04)] hover:text-[#0D140F]">
                <X size={16} />
              </Button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
  if (!mounted) return null
  return createPortal(content, document.body)
}

export function ModalBody({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-6 py-6 space-y-5 bg-[#FDFCF7] ${className}`}>{children}</div>
}

export function ModalFooter({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`flex gap-3 px-6 py-5 border-t border-[rgba(13,20,15,0.06)] bg-[rgba(13,20,15,0.02)] justify-end ${className}`}>{children}</div>
}
