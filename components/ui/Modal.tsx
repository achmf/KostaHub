'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from './button'

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
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            initial={{ scale: 0.97, opacity: 0, y: 6 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.97, opacity: 0, y: 6 }}
            transition={{ type: 'spring' as const, stiffness: 420, damping: 32 }}
            className={`bg-[#FFFFFF] rounded-[12px] shadow-dropdown w-full ${MAX_W[maxWidth]}`}
          >
            {/* Header */}
            <div className="flex justify-between items-start px-6 py-5 border-b border-[#E8E8EC]">
              <div>
                <h2 className="text-lg font-semibold text-[#0A0A0A] font-display tracking-tight">{title}</h2>
                {description && <p className="text-sm text-[#6B6B6B] mt-0.5">{description}</p>}
              </div>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Tutup" className="ml-4 shrink-0">
                <X size={16} />
              </Button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function ModalBody({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`px-6 py-5 space-y-4 ${className}`}>{children}</div>
}

export function ModalFooter({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return <div className={`flex gap-3 px-6 pb-6 pt-3 justify-end ${className}`}>{children}</div>
}
