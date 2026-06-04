'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface FarmSelectorProps {
  farms: { id: string; nama: string }[]
}

export default function FarmSelector({ farms }: FarmSelectorProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentFarm = searchParams.get('farmId') || 'all'

  const handleValueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all') {
      params.delete('farmId')
    } else {
      params.set('farmId', value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="relative flex items-center">
      <span
        className="absolute left-3 w-1.5 h-1.5 rounded-full pointer-events-none"
        style={{ background: '#C7873E' }}
      />
      <select
        value={currentFarm}
        onChange={handleValueChange}
        className="h-9 pl-7 pr-8 appearance-none rounded-full border"
        style={{
          borderColor: 'rgba(13,20,15,0.12)',
          background: '#fff',
          fontFamily: "'Inter',sans-serif",
          fontSize: 13,
          color: '#0D140F',
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        <option value="all">Semua Farm</option>
        {farms.map((farm) => (
          <option key={farm.id} value={farm.id}>
            {farm.nama}
          </option>
        ))}
      </select>
      <ChevronDown
        size={14}
        className="absolute right-2.5 pointer-events-none"
        style={{ opacity: 0.5, color: '#0D140F' }}
      />
    </div>
  )
}
