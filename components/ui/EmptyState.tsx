import { LucideIcon } from 'lucide-react'
import { GiGoat } from 'react-icons/gi'

interface EmptyStateProps {
  icon?: LucideIcon | React.ComponentType<{ size?: number; className?: string }>
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
  useGoatIcon?: boolean
}

export function EmptyState({ icon: Icon, title, description, action, className = '', useGoatIcon }: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-20 text-center ${className}`}>
      <div className="w-14 h-14 rounded-[8px] bg-[#F4F4F6] border border-[#E8E8EC] flex items-center justify-center mb-4">
        {useGoatIcon ? (
          <GiGoat size={28} className="text-[#9C9C9C]" />
        ) : Icon ? (
          <Icon size={24} className="text-[#9C9C9C]" />
        ) : null}
      </div>
      <p className="font-semibold text-[#0A0A0A] text-sm">{title}</p>
      {description && <p className="text-xs text-[#9C9C9C] mt-1 max-w-[240px] leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}
