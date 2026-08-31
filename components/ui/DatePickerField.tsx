'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { palette } from '@/components/KostaUI'

interface DatePickerFieldProps {
  /** Name attribute untuk hidden input — digunakan oleh FormData / React Server Actions */
  name: string
  /** Nilai awal sebagai string ISO (YYYY-MM-DD) atau Date object */
  defaultValue?: string | Date | null
  /** Apakah field ini required */
  required?: boolean
  /** Placeholder text saat belum ada tanggal dipilih */
  placeholder?: string
  /** Nonaktifkan tanggal yang lebih dari hari ini */
  disableFuture?: boolean
  /** Nonaktifkan tanggal yang lebih awal dari hari ini */
  disablePast?: boolean
  /** Custom className untuk trigger button */
  className?: string
  /** Apakah picker dinonaktifkan */
  disabled?: boolean
}

function parseDefaultDate(val: string | Date | null | undefined): Date | undefined {
  if (!val) return undefined
  if (val instanceof Date) return isNaN(val.getTime()) ? undefined : val
  // Pastikan format YYYY-MM-DD di-parse sebagai local time, bukan UTC
  const [year, month, day] = val.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const d = new Date(year, month - 1, day)
  return isNaN(d.getTime()) ? undefined : d
}

function toISODateString(d: Date): string {
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatDisplayDate(d: Date): string {
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

const monthNames = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

// ─── CUSTOM SINGLE CALENDAR COMPONENT ─────────────────────────────
function SingleCalendar({
  selected,
  onSelect,
  disableFuture,
  disablePast,
}: {
  selected: Date | undefined
  onSelect: (d: Date) => void
  disableFuture?: boolean
  disablePast?: boolean
}) {
  const parsed = selected || new Date()
  const [viewDate, setViewDate] = React.useState(() => new Date(parsed.getFullYear(), parsed.getMonth(), 1))

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - 50 + i)

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay() // 0 = Sunday

  const handlePrev = () => setViewDate(new Date(year, month - 1, 1))
  const handleNext = () => setViewDate(new Date(year, month + 1, 1))

  const days = []
  for (let i = 0; i < firstDay; i++) {
    days.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i)
  }

  const getDateStr = (d: number) => {
    const next = new Date(year, month, d)
    const offset = next.getTimezoneOffset() * 60000
    return new Date(next.getTime() - offset).toISOString().split('T')[0]
  }

  const isSelected = (d: number) => selected && getDateStr(d) === toISODateString(selected)
  
  const isDisabled = (d: number) => {
    const dateStr = getDateStr(d)
    const todayStr = toISODateString(new Date())
    if (disableFuture && dateStr > todayStr) return true
    if (disablePast && dateStr < todayStr) return true
    return false
  }

  return (
    <div className="w-[230px] p-2">
      <div className="flex items-center justify-between mb-3 px-1">
        <button onClick={handlePrev} className="p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer text-ink">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="flex gap-1" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, color: palette.ink }}>
          <Select value={String(month)} onValueChange={(val) => val && setViewDate(new Date(year, parseInt(val), 1))}>
            <SelectTrigger className="h-7 border-none bg-transparent shadow-none px-1.5 py-0 w-auto hover:bg-black/5 rounded text-[13px] font-medium text-ink gap-1 [&_svg]:size-3.5 focus-visible:ring-0 focus-visible:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {monthNames.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={String(year)} onValueChange={(val) => val && setViewDate(new Date(parseInt(val), month, 1))}>
            <SelectTrigger className="h-7 border-none bg-transparent shadow-none px-1.5 py-0 w-auto hover:bg-black/5 rounded text-[13px] font-medium text-ink gap-1 [&_svg]:size-3.5 focus-visible:ring-0 focus-visible:ring-offset-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button onClick={handleNext} className="p-1.5 rounded-full hover:bg-black/5 transition-colors cursor-pointer text-ink">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center mb-1">
        {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((d, i) => (
          <div key={i} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, opacity: 0.4 }}>
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} className="aspect-square" />
          
          const isSel = isSelected(d)
          const isDis = isDisabled(d)

          return (
            <div key={i} className="relative aspect-square flex items-center justify-center">
              <button
                onClick={() => {
                  if (!isDis) onSelect(new Date(year, month, d))
                }}
                disabled={isDis}
                className={cn(
                  "relative z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all",
                  isDis ? "cursor-not-allowed opacity-30" : "cursor-pointer hover:bg-black/5"
                )}
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 11,
                  background: isSel ? palette.ink : 'transparent',
                  color: isSel ? palette.cream : palette.ink,
                  fontWeight: isSel ? 500 : 400,
                }}
              >
                {d}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/**
 * DatePickerField — custom date picker yang menggabungkan Calendar + Popover.
 *
 * Mengirim value sebagai string "YYYY-MM-DD" via hidden input sehingga
 * kompatibel dengan React Server Actions dan FormData.
 * Tidak memerlukan dependency tambahan selain yang sudah ada di project.
 */
export function DatePickerField({
  name,
  defaultValue,
  required,
  placeholder = 'Pilih tanggal',
  disableFuture = false,
  disablePast = false,
  className,
  disabled = false,
}: DatePickerFieldProps) {
  const [open, setOpen] = React.useState(false)
  const [date, setDate] = React.useState<Date | undefined>(
    parseDefaultDate(defaultValue)
  )

  const isoValue = date ? toISODateString(date) : ''

  return (
    <div className="relative w-full">
      {/* Hidden input membawa value ke FormData / server actions */}
      <input
        type="hidden"
        name={name}
        value={isoValue}
        required={required}
        readOnly
      />

      <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
        <PopoverTrigger
          disabled={disabled}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl border text-left text-sm transition-all',
            'bg-[rgba(13,20,15,0.03)] border-[rgba(13,20,15,0.10)]',
            "font-['Inter',sans-serif]",
            'px-4 py-3',
            'hover:bg-[rgba(13,20,15,0.05)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3F5B3A]/40',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            date ? 'text-[#0D140F]' : 'text-[rgba(13,20,15,0.40)]',
            className
          )}
          aria-label={date ? formatDisplayDate(date) : placeholder}
        >
          <CalendarIcon className="size-4 shrink-0 text-[rgba(13,20,15,0.45)]" />
          <span className="flex-1 truncate">
            {date ? formatDisplayDate(date) : placeholder}
          </span>
        </PopoverTrigger>

        <PopoverContent
          className="w-auto p-1 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border-[rgba(13,20,15,0.1)]"
          align="start"
          side="bottom"
          sideOffset={6}
        >
          <SingleCalendar
            selected={date}
            onSelect={(d) => {
              setDate(d)
              setOpen(false)
            }}
            disableFuture={disableFuture}
            disablePast={disablePast}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
