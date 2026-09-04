'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ExternalLink, Trash2 } from 'lucide-react'
import { switchFarm } from '@/actions/switchFarm'
import { deleteFarm } from '@/actions/farm'
import { palette } from '@/components/KostaUI'
import { useConfirm, useAlert } from '@/components/ConfirmProvider'

interface AdminFarmActionsProps {
  farmId: string
}

export default function AdminFarmActions({ farmId }: AdminFarmActionsProps) {
  const router = useRouter()
  const { confirm } = useConfirm()
  const { alert } = useAlert()
  const [isPendingDashboard, startDashboardTransition] = useTransition()
  const [isPendingDelete, startDeleteTransition] = useTransition()

  const handleOpenDashboard = () => {
    startDashboardTransition(async () => {
      try {
        await switchFarm(farmId)
      } catch (e: any) {
        if (e.message === 'NEXT_REDIRECT') {
          throw e
        }
        await alert({
          title: 'Gagal Membuka Dashboard',
          message: e.message || 'Terjadi kesalahan saat memuat data.',
          variant: 'danger'
        })
      }
    })
  }

  const handleDelete = async () => {
    const isConfirmed = await confirm({
      title: 'Hapus Farm?',
      message: 'Apakah Anda yakin ingin menghapus farm ini? Tindakan ini tidak dapat dibatalkan.',
      confirmText: 'Ya, Hapus',
      variant: 'danger',
    })

    if (!isConfirmed) return

    startDeleteTransition(async () => {
      try {
        const res = await deleteFarm(farmId)
        if (res.error) {
          await alert({
            title: 'Gagal Menghapus',
            message: res.error,
            variant: 'danger'
          })
        } else {
          router.push('/admin/farms')
        }
      } catch (e: any) {
        await alert({
          title: 'Error',
          message: e.message || 'Gagal menghapus farm',
          variant: 'danger'
        })
      }
    })
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        onClick={handleOpenDashboard}
        disabled={isPendingDashboard || isPendingDelete}
        className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
        style={{
          background: palette.forest,
          color: palette.cream,
          fontFamily: "'Inter',sans-serif",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <ExternalLink size={15} />
        {isPendingDashboard ? 'Membuka...' : 'Buka Dashboard'}
      </button>

      <button
        onClick={handleDelete}
        disabled={isPendingDashboard || isPendingDelete}
        className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
        style={{
          background: 'rgba(181,68,59,0.08)',
          color: palette.danger,
          fontFamily: "'Inter',sans-serif",
          fontSize: 13,
          fontWeight: 500,
        }}
      >
        <Trash2 size={15} />
        {isPendingDelete ? 'Menghapus...' : 'Hapus Farm'}
      </button>
    </div>
  )
}
