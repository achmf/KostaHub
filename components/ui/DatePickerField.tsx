'use client'

import * as React from 'react'
import { CalendarIcon } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

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

  const disabledMatcher = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (disableFuture && disablePast) return undefined
    if (disableFuture) return { after: today }
    if (disablePast) return { before: today }
    return undefined
  }, [disableFuture, disablePast])

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
          className="w-auto p-0"
          align="start"
          side="bottom"
          sideOffset={6}
        >
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => {
              setDate(d)
              setOpen(false)
            }}
            defaultMonth={date ?? new Date()}
            disabled={disabledMatcher}
            captionLayout="dropdown"
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
