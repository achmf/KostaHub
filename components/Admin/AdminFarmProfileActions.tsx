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
  canEdit?: boolean
}

export default function AdminFarmProfileActions({ farm, canEdit = true }: AdminFarmProfileActionsProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  if (!canEdit) return null

  return (
    <div className="flex flex-col gap-3 sm:items-end">
      {/* Mobile: grid 2 kolom — "Buka Dashboard" penuh di atas, Edit & Hapus berdampingan */}
      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <button
          onClick={() => setIsEditModalOpen(true)}
          className="flex items-center justify-center gap-2 min-h-10 sm:min-h-0 px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
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
