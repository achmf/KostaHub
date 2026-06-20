'use client'

import { motion } from 'framer-motion'
import { ReactNode, useEffect } from 'react'

const palette = {
  cream: '#F2EDE0',
  creamSoft: '#FBF8EF',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  mossSoft: '#A5B5A0',
  ochre: '#C7873E',
  ochreSoft: '#E2B883',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  borderStrong: 'rgba(13,20,15,0.18)',
  rose: '#B5443B',
  amber: '#D9A23C',
  emerald: '#3F7A4E',
}

export { palette }

export function Badge({
  children,
  variant = 'default',
  surface = 'light',
}: {
  children: ReactNode
  variant?: 'default' | 'emerald' | 'amber' | 'rose' | 'ochre' | 'moss' | 'ink' | 'cream'
  surface?: 'light' | 'dark'
}) {
  const mapLight: Record<string, { bg: string; fg: string }> = {
    default: { bg: 'rgba(13,20,15,0.06)', fg: palette.ink },
    emerald: { bg: 'rgba(63,122,78,0.14)', fg: palette.emerald },
    amber: { bg: 'rgba(217,162,60,0.18)', fg: '#7E5A18' },
    rose: { bg: 'rgba(181,68,59,0.14)', fg: palette.rose },
    ochre: { bg: 'rgba(199,135,62,0.18)', fg: '#7A4F1E' },
    moss: { bg: 'rgba(63,91,58,0.14)', fg: palette.moss },
    ink: { bg: palette.ink, fg: palette.cream },
    cream: { bg: 'rgba(242,237,224,0.15)', fg: palette.cream },
  }

  const mapDark: Record<string, { bg: string; fg: string }> = {
    default: { bg: 'rgba(242,237,224,0.15)', fg: palette.cream }, // Fallback to cream
    emerald: { bg: 'rgba(63,122,78,0.25)', fg: '#8AD29F' }, // Lighter emerald
    amber: { bg: 'rgba(217,162,60,0.25)', fg: '#F5D38A' }, // Lighter amber
    rose: { bg: 'rgba(181,68,59,0.25)', fg: '#F2B2AD' }, // Lighter rose
    ochre: { bg: 'rgba(199,135,62,0.25)', fg: '#EBC39A' }, // Lighter ochre
    moss: { bg: 'rgba(63,91,58,0.25)', fg: '#A3C19A' }, // Lighter moss
    ink: { bg: 'rgba(242,237,224,0.15)', fg: palette.cream },
    cream: { bg: 'rgba(242,237,224,0.15)', fg: palette.cream },
  }

  const c = surface === 'dark' ? mapDark[variant] || mapDark.default : mapLight[variant] || mapLight.default
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded"
      style={{
        background: c.bg,
        color: c.fg,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  )
}

export function KostaPageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-wrap items-end justify-between gap-4 mb-8"
    >
      <div>
        <h1
          className="mt-2 tracking-[-0.025em]"
          style={{
            fontFamily: "'Fraunces',serif",
            fontSize: 'clamp(2rem,4vw,3rem)',
            lineHeight: 1,
            fontWeight: 400,
          }}
        >
          {title}
        </h1>
        {description && (
          <p
            className="mt-3 max-w-xl"
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 14,
              color: 'rgba(13,20,15,0.65)',
              lineHeight: 1.55,
            }}
          >
            {description}
          </p>
        )}
      </div>
      {action}
    </motion.div>
  )
}

export function KostaCard({
  children,
  className = '',
  style,
}: {
  children: ReactNode
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div
      className={`rounded-2xl ${className}`}
      style={{
        background: '#fff',
        border: `1px solid ${palette.border}`,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function KostaButton({
  children,
  variant = 'primary',
  onClick,
  size = 'md',
  type = 'button',
  disabled = false,
  className = '',
}: {
  children: ReactNode
  variant?: 'primary' | 'outline' | 'ghost'
  onClick?: () => void
  size?: 'sm' | 'md'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: palette.ink, color: palette.cream, border: '1px solid transparent' },
    outline: { background: '#fff', color: palette.ink, border: `1px solid ${palette.borderStrong}` },
    ghost: { background: 'transparent', color: palette.ink, border: '1px solid transparent' },
  }
  const sz = size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2.5 text-[13px]'
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full inline-flex items-center gap-2 transition-transform active:scale-[0.97] hover:-translate-y-px cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sz} ${className}`}
      style={{ fontFamily: "'Inter',sans-serif", ...styles[variant] }}
    >
      {children}
    </button>
  )
}

export function KostaEmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="text-center py-16">
      <div
        style={{
          fontFamily: "'Fraunces',serif",
          fontSize: 22,
          fontStyle: 'italic',
          color: palette.moss,
        }}
      >
        {title}
      </div>
      {hint && (
        <div
          className="mt-2"
          style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.6)' }}
        >
          {hint}
        </div>
      )}
    </div>
  )
}

export function KostaSectionLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={className}
      style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10,
        letterSpacing: '0.18em',
        color: 'rgba(13,20,15,0.55)',
      }}
    >
      {children}
    </div>
  )
}

export function KostaDialog({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'md',
}: {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const maxWClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={`w-full ${maxWClass} bg-white rounded-2xl shadow-xl overflow-hidden`}
        style={{ border: `1px solid ${palette.border}` }}
      >
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: palette.border }}>
          <h2 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: palette.ink }}>{title}</h2>
          <button 
            onClick={onClose} 
            className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[80vh]">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
