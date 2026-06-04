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
    <AnimatedSection className={`flex items-start justify-between gap-4 ${className}`}>
      <div className="flex items-center gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="p-2 hover:bg-[#F4F4F6] rounded-[6px] text-[#6B6B6B] hover:text-[#0A0A0A] transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
        )}
        <div>
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
