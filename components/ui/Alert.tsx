'use client'

import { motion } from 'framer-motion'
import { AlertCircle, CheckCircle, AlertTriangle, Info, X } from 'lucide-react'

type AlertVariant = 'error' | 'success' | 'warning' | 'info'

interface AlertProps {
  variant: AlertVariant
  title?: string
  children: React.ReactNode
  onDismiss?: () => void
  className?: string
}

const STYLES: Record<AlertVariant, { wrapper: string; icon: React.ReactNode }> = {
  error: {
    wrapper: 'bg-red-50 border border-[#EF4444]/30 text-[#EF4444]',
    icon: <AlertCircle size={15} className="shrink-0 mt-0.5" />,
  },
  success: {
    wrapper: 'bg-emerald-50 border border-[#10B981]/30 text-[#10B981]',
    icon: <CheckCircle size={15} className="shrink-0 mt-0.5" />,
  },
  warning: {
    wrapper: 'bg-amber-50 border border-[#F59E0B]/30 text-[#F59E0B]',
    icon: <AlertTriangle size={15} className="shrink-0 mt-0.5" />,
  },
  info: {
    wrapper: 'bg-indigo-50 border border-[#6366F1]/20 text-[#6366F1]',
    icon: <Info size={15} className="shrink-0 mt-0.5" />,
  },
}

export function Alert({ variant, title, children, onDismiss, className = '' }: AlertProps) {
  const s = STYLES[variant]
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className={`flex items-start gap-3 px-4 py-3.5 rounded-[8px] text-sm ${s.wrapper} ${className}`}
    >
      {s.icon}
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm mb-0.5">{title}</p>}
        <div className="leading-relaxed">{children}</div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="cursor-pointer shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5"
          aria-label="Tutup notifikasi"
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  )
}
