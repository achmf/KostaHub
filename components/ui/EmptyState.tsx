import { LucideIcon } from 'lucide-react'
import { GiGoat } from 'react-icons/gi'

const palette = {
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.09)',
}

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ size?: number; style?: React.CSSProperties }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  useGoatIcon?: boolean
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
  useGoatIcon,
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-20 text-center ${className}`}
    >
      {/* Icon container */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
        style={{
          background: 'rgba(199,135,62,0.10)',
          border: `1px solid rgba(199,135,62,0.18)`,
        }}
      >
        {useGoatIcon ? (
          <GiGoat size={26} style={{ color: palette.ochre, opacity: 0.7 }} />
        ) : Icon ? (
          <Icon size={22} style={{ color: palette.ochre, opacity: 0.7 }} />
        ) : null}
      </div>

      {/* Title */}
      <p
        style={{
          fontFamily: "'Fraunces',serif",
          fontSize: 18,
          fontWeight: 400,
          letterSpacing: '-0.01em',
          color: palette.ink,
        }}
      >
        {title}
      </p>

      {/* Description */}
      {description && (
        <p
          className="mt-1.5 max-w-[260px] leading-relaxed"
          style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: 13,
            color: 'rgba(13,20,15,0.5)',
          }}
        >
          {description}
        </p>
      )}

      {/* CTA action */}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
