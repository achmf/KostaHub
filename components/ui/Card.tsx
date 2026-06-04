import { AnimatedSection } from './AnimatedSection'

interface CardProps {
  /** Legacy accent prop — ignored in Genesis system */
  accent?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  className?: string
  onClick?: React.MouseEventHandler<HTMLDivElement>
  children: React.ReactNode
}

const PADDING: Record<string, string> = {
  none: '',
  sm:   'p-4',
  md:   'p-6',
  lg:   'p-8',
}

import { forwardRef } from 'react'

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', hover = false, className = '', onClick, children }, ref) => {
    return (
      <AnimatedSection
        ref={ref}
        onClick={onClick}
        className={[
          'bg-[#FFFFFF] rounded-[12px] border border-[#E8E8EC] overflow-hidden',
          hover ? 'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover' : '',
          className,
        ].join(' ')}
      >
        {padding !== 'none' ? (
          <div className={PADDING[padding]}>{children}</div>
        ) : (
          children
        )}
      </AnimatedSection>
    )
  }
)
Card.displayName = 'Card'

export function CardHeader({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-center justify-between pb-4 border-b border-[#E8E8EC] ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={`text-base font-semibold text-[#0A0A0A] font-display tracking-tight ${className}`}>
      {children}
    </h3>
  )
}
