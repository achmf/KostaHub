'use client'

import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import AdminCreateUserModal from '@/components/Admin/AdminCreateUserModal'

const palette = {
  forest: '#1B2A1F',
  cream: '#F2EDE0',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.09)',
  muted: 'rgba(13,20,15,0.4)',
}

interface Props {
  totalUsers: number
  canCreate: boolean
}

export default function AdminUsersHeader({ totalUsers, canCreate }: Props) {
  const [modalOpen, setModalOpen] = useState(false)

  return (
    <>
      {/* Header section */}
      <div className="mb-8 flex items-start sm:items-end justify-between gap-4 sm:flex-wrap">
        <div className="min-w-0">
          <div
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              letterSpacing: '0.2em',
              color: palette.muted,
              marginBottom: 8,
            }}
          >
            MANAJEMEN USER
          </div>
          <h1
            style={{
              fontFamily: "'Fraunces',serif",
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 400,
              letterSpacing: '-0.025em',
            }}
          >
            Semua{' '}
            <span style={{ fontStyle: 'italic', color: palette.ochre }}>User</span>
          </h1>
          <p
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 14,
              color: 'rgba(13,20,15,0.55)',
              marginTop: 4,
            }}
          >
            Daftar semua user terdaftar di seluruh farm ({totalUsers} total).
          </p>
        </div>

        {canCreate && (
          <button
            id="btn-create-user"
            onClick={() => setModalOpen(true)}
            aria-label="Buat User"
            className="cursor-pointer shrink-0 flex items-center justify-center gap-2 min-w-10 min-h-10 px-3 md:px-4 py-2.5 rounded-xl transition-all hover:opacity-90 active:scale-95"
            style={{
              fontFamily: "'Inter',sans-serif",
              fontSize: 13,
              fontWeight: 500,
              background: palette.forest,
              color: palette.cream,
              border: 'none',
            }}
          >
            <UserPlus size={16} className="md:w-[14px] md:h-[14px]" />
            <span className="hidden md:inline">Buat User</span>
          </button>
        )}
      </div>

      {/* Modal */}
      <AdminCreateUserModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  )
}
