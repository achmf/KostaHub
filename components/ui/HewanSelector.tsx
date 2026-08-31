'use client'

import { useState } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Check, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HewanOption {
  id: string
  tag: string
  nama: string | null
}

interface HewanSelectorProps {
  hewanList: HewanOption[]
  name?: string
  value?: string
  onChange?: (value: string) => void
  placeholder?: string
  required?: boolean
  className?: string
  error?: boolean
}

export function HewanSelector({
  hewanList,
  name,
  value,
  onChange,
  placeholder = "— Cari atau Pilih Hewan —",
  required = false,
  className,
  error = false,
}: HewanSelectorProps) {
  const [open, setOpen] = useState(false)
  // Fallback state if it's used uncontrolled
  const [internalValue, setInternalValue] = useState(value || '')
  
  const currentValue = value !== undefined ? value : internalValue
  
  const handleSelect = (val: string) => {
    setInternalValue(val)
    if (onChange) {
      onChange(val)
    }
    setOpen(false)
  }

  const selectedHewan = hewanList.find((h) => h.id === currentValue)

  return (
    <>
      {name && <input type="hidden" name={name} value={currentValue} required={required} />}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-border/60 bg-white/60 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all hover:bg-white shadow-sm",
            error && "border-red-500 focus:ring-red-500",
            className
          )}
          style={{ fontFamily: "'Inter',sans-serif" }}
        >
          {selectedHewan
            ? `${selectedHewan.tag}${selectedHewan.nama ? ` — ${selectedHewan.nama}` : ''}`
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-xl border-border shadow-lg" align="start">
          <Command>
            <CommandInput placeholder="Cari tag atau nama hewan..." className="text-sm h-11" />
            <CommandList>
              <CommandEmpty>Hewan tidak ditemukan.</CommandEmpty>
              <CommandGroup>
                {hewanList.map((h) => (
                  <CommandItem
                    key={h.id}
                    value={`${h.tag} ${h.nama || ''}`}
                    onSelect={() => handleSelect(h.id)}
                    className="rounded-lg my-1 cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        currentValue === h.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {h.tag}{h.nama ? ` — ${h.nama}` : ''}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  )
}
