import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { AnimatedSection } from './AnimatedSection'

interface PageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
  backHref?: string
  className?: string
}

export function PageHeader({ title, description, action, backHref, className = '' }: PageHeaderProps) {
  return (
    <AnimatedSection className={`flex flex-wrap items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3 min-w-0">
        {backHref && (
          <Link
            href={backHref}
            className="w-10 h-10 shrink-0 flex items-center justify-center hover:bg-[#F4F4F6] rounded-[6px] text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
            aria-label="Kembali"
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-[#0A0A0A] font-display tracking-tight sm:text-[32px]">
            {title}
          </h1>
          {description && (
            <p className="text-[#6B6B6B] text-sm mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </AnimatedSection>
  )
}
