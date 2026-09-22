'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface FarmSelectorProps {
  farms: { id: string; nama: string }[]
}

export default function FarmSelector({ farms }: FarmSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentFarm = searchParams.get('farmId') || 'all'

  const handleValueChange = (value: string | null) => {
    const val = value ?? 'all'
    const params = new URLSearchParams(searchParams.toString())
    if (val === 'all') {
      params.delete('farmId')
    } else {
      params.set('farmId', val)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <Select value={currentFarm} onValueChange={handleValueChange}>
      <SelectTrigger
        size="sm"
        className="h-9 pl-6 rounded-full border-border/40 bg-white hover:bg-white shadow-none min-w-[130px]"
        style={{
          fontFamily: "'Inter',sans-serif",
          fontSize: 13,
          color: '#0D140F',
        }}
      >
        {/* Ochre dot indicator */}
        <span
          className="absolute left-2.5 w-1.5 h-1.5 rounded-full pointer-events-none shrink-0"
          style={{ background: '#C7873E' }}
        />
        <SelectValue placeholder="Semua Farm">
          {(val: string) => {
            if (val === 'all') return 'Semua Farm'
            const selected = farms.find(f => f.id === val)
            return selected ? selected.nama : 'Semua Farm'
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent align="end">
        <SelectItem value="all">Semua Farm</SelectItem>
        {farms.map((farm) => (
          <SelectItem key={farm.id} value={farm.id}>
            {farm.nama}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
