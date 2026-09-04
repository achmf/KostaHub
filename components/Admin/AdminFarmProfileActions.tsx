'use client'

import { useState } from 'react'
import { Edit3 } from 'lucide-react'
import EditFarmModal from '@/components/Admin/EditFarmModal'
import AdminFarmActions from '@/components/Admin/AdminFarmActions'
import { palette } from '@/components/KostaUI'

interface AdminFarmProfileActionsProps {
  farm: {
    id: string
    nama: string
    alamat: string | null
    deskripsi: string | null
    lat: number | null
    lng: number | null
    status: string
  }
}

export default function AdminFarmProfileActions({ farm }: AdminFarmProfileActionsProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3 items-end">
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
          style={{
            background: 'rgba(13,20,15,0.06)',
            color: palette.ink,
            fontFamily: "'Inter',sans-serif",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Edit3 size={15} />
          Edit Farm
        </button>
        <AdminFarmActions farmId={farm.id} />
      </div>
      <EditFarmModal open={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} farm={farm} />
    </div>
  )
}
