'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

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
  muted: 'rgba(13,20,15,0.6)',
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
    emerald: { bg: 'rgba(63,122,78,0.15)', fg: '#285133' },
    amber: { bg: 'rgba(217,162,60,0.2)', fg: '#5E4211' },
    rose: { bg: 'rgba(181,68,59,0.15)', fg: '#7A2C26' },
    ochre: { bg: 'rgba(199,135,62,0.2)', fg: '#634017' },
    moss: { bg: 'rgba(63,91,58,0.15)', fg: '#2C4029' },
    ink: { bg: palette.ink, fg: palette.cream },
    cream: { bg: 'rgba(13,20,15,0.06)', fg: palette.ink }, // Fixed: Use dark text for cream on light surface
  }

  const mapDark: Record<string, { bg: string; fg: string }> = {
    default: { bg: 'rgba(242,237,224,0.15)', fg: palette.cream },
    emerald: { bg: 'rgba(63,122,78,0.3)', fg: '#B3F0C9' },
    amber: { bg: 'rgba(217,162,60,0.3)', fg: '#FFEAA6' },
    rose: { bg: 'rgba(181,68,59,0.3)', fg: '#FFD3D0' },
    ochre: { bg: 'rgba(199,135,62,0.3)', fg: '#FFE2C2' },
    moss: { bg: 'rgba(63,91,58,0.3)', fg: '#CDEBBF' },
    ink: { bg: 'rgba(242,237,224,0.2)', fg: palette.cream },
    cream: { bg: 'rgba(242,237,224,0.2)', fg: palette.cream },
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
  style,
  id,
}: {
  children: ReactNode
  variant?: 'primary' | 'outline' | 'ghost'
  onClick?: () => void
  size?: 'sm' | 'md'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  className?: string
  style?: React.CSSProperties
  id?: string
}) {
  const styles: Record<string, React.CSSProperties> = {
    primary: { background: palette.ink, color: palette.cream, border: '1px solid transparent' },
    outline: { background: '#fff', color: palette.ink, border: `1px solid ${palette.borderStrong}` },
    ghost: { background: 'transparent', color: palette.ink, border: '1px solid transparent' },
  }
  const sz = size === 'sm' ? 'px-3 py-1.5 text-[12px]' : 'px-4 py-2.5 text-[13px]'
  return (
    <button
      id={id}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full inline-flex items-center gap-2 transition-transform active:scale-[0.97] hover:-translate-y-px cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${sz} ${className}`}
      style={{ fontFamily: "'Inter',sans-serif", ...styles[variant], ...style }}
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

export function KostaSectionLabel({ children, className = '', style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10,
        letterSpacing: '0.18em',
        color: 'rgba(13,20,15,0.55)',
        ...style,
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
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

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

  if (!mounted) return null

  const maxWClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  }[maxWidth]

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            role="dialog"
            aria-modal="true"
            className={`relative z-10 w-full ${maxWClass} bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[90dvh]`}
            style={{ border: `1px solid ${palette.border}` }}
          >
        <div className="flex items-center justify-between gap-3 px-5 py-3 sm:py-4 border-b shrink-0" style={{ borderColor: palette.border }}>
          <h2 className="min-w-0" style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: palette.ink }}>{title}</h2>
          <button 
            onClick={onClose} 
            aria-label="Tutup"
            className="cursor-pointer -mr-2 w-10 h-10 shrink-0 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto overscroll-contain min-h-0 flex-1">
          {children}
        </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  )
}

export function KostaSpinner({
  size = 'md',
  color = 'ochre',
  text,
}: {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  color?: 'ochre' | 'ink' | 'cream' | 'moss'
  text?: string
}) {
  const sizeMap = { sm: 16, md: 24, lg: 32, xl: 48 }
  const colorMap = {
    ochre: palette.ochre,
    ink: palette.ink,
    cream: palette.cream,
    moss: palette.moss,
  }

  return (
    <div className="flex flex-col items-center justify-center gap-3">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={sizeMap[size]}
        height={sizeMap[size]}
        viewBox="0 0 24 24"
        fill="none"
        stroke={colorMap[color]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-spin"
      >
        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
      </svg>
      {text && (
        <div
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: size === 'sm' ? 10 : 12,
            letterSpacing: '0.1em',
            color: 'rgba(13,20,15,0.5)',
            textTransform: 'uppercase',
          }}
        >
          {text}
        </div>
      )}
    </div>
  )
}
