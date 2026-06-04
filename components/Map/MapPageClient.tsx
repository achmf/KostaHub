'use client'

import dynamic from 'next/dynamic'
import { KostaPageHeader } from '@/components/KostaUI'

const palette = { moss: '#3F5B3A', cream: '#F2EDE0' }

const FarmMap = dynamic(() => import('@/components/Map/FarmMap'), {
  ssr: false,
  loading: () => (
    <div
      className="flex items-center justify-center h-[600px] rounded-2xl"
      style={{ background: 'rgba(13,20,15,0.04)', border: '1px solid rgba(13,20,15,0.10)' }}
    >
      <div className="text-center">
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4"
          style={{ borderColor: `${palette.moss} transparent ${palette.moss} ${palette.moss}` }}
        />
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, opacity: 0.6 }}>Memuat peta…</p>
      </div>
    </div>
  )
})

interface Farm {
  id: string
  nama: string
  alamat: string | null
  lat: number | null
  lng: number | null
  geojson: string | null
  deskripsi: string | null
  status: string
  _count: { hewan: number }
}

export default function MapPageClient({ farms }: { farms: Farm[] }) {
  return (
    <div>
      <KostaPageHeader
        title="Visualisasi Geografis"
        description="Marker lokasi farm dan polygon kandang berbasis koordinat GPS."
      />
      <FarmMap farms={farms} />
    </div>
  )
}
