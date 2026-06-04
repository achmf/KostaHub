// Genesis status/tag chip system
// Shapes: pill (rounded-full), tag (4px radius)
// Colors: semantic tokens from genesis-DESIGN.md

type Variant = 'indigo' | 'success' | 'warning' | 'error' | 'neutral' | 'gray'
             | 'teal' | 'blue' | 'amber' | 'rose' | 'pink' | 'cyan' | 'emerald'
type Shape   = 'pill' | 'tag' | 'rounded'

interface BadgeProps {
  variant?: Variant
  shape?: Shape
  size?: 'sm' | 'md'
  icon?: React.ReactNode
  className?: string
  children: React.ReactNode
}

const VARIANT_CLASSES: Record<Variant, string> = {
  // Genesis semantic
  indigo:  'bg-indigo-50 text-[#6366F1]',
  success: 'bg-emerald-50 text-[#10B981]',
  warning: 'bg-amber-50  text-[#F59E0B]',
  error:   'bg-red-50    text-[#EF4444]',
  neutral: 'bg-[#F4F4F6] text-[#6B6B6B]',
  gray:    'bg-[#F4F4F6] text-[#6B6B6B]',
  // Domain colors (kept for backward-compat with feature pages)
  teal:    'bg-teal-50  text-teal-700',
  blue:    'bg-blue-50  text-blue-700',
  amber:   'bg-amber-50 text-amber-700',
  rose:    'bg-rose-50  text-rose-700',
  pink:    'bg-pink-50  text-pink-600',
  cyan:    'bg-cyan-50  text-cyan-700',
  emerald: 'bg-emerald-50 text-emerald-700',
}

const SHAPE_CLASSES: Record<Shape, string> = {
  pill:    'rounded-full',
  tag:     'rounded-[4px]',
  rounded: 'rounded-[4px]',
}

const SIZE_CLASSES = {
  sm: 'px-2   py-0.5 text-[11px] gap-1',
  md: 'px-3   py-1   text-xs     gap-1.5',
}

export function Badge({ variant = 'gray', shape = 'pill', size = 'md', icon, className = '', children }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-semibold ${VARIANT_CLASSES[variant]} ${SHAPE_CLASSES[shape]} ${SIZE_CLASSES[size]} ${className}`}>
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}

// Domain value → badge variant maps
export const STATUS_BADGE_VARIANT: Record<string, Variant> = {
  AKTIF:      'success',
  MATI:       'error',
  TERJUAL:    'blue',
  HAMIL:      'pink',
  TIDAK_HAMIL:'neutral',
  BARU_LAHIR: 'warning',
}

export const KATEGORI_BADGE_VARIANT: Record<string, Variant> = {
  INDUKAN:      'teal',
  PEJANTAN:     'cyan',
  ANAKAN:       'amber',
  DARA:         'pink',
  JANTAN_MUDA:  'emerald',
}
