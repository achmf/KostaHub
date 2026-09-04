'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import AddFarmModal from '@/components/Admin/AddFarmModal'
import { palette } from '@/components/KostaUI'

export default function AdminFarmsHeader() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)

  return (
    <>
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 8 }}>
            MANAJEMEN FARM
          </div>
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: '-0.025em' }}>
            Semua <span style={{ fontStyle: 'italic', color: palette.ochre }}>Farm</span>
          </h1>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.55)', marginTop: 4 }}>
            Daftar semua peternakan yang terdaftar di sistem.
          </p>
        </div>
        
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0"
          style={{
            background: palette.forest,
            color: palette.cream,
            fontFamily: "'Inter',sans-serif",
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          <Plus size={16} />
          Tambah Farm
        </button>
      </div>

      <AddFarmModal open={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
    </>
  )
}
