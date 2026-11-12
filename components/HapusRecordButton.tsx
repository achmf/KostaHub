'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useConfirm } from '@/components/ConfirmProvider'

// Tombol hapus generik: `action` adalah server action (id) => { error } | { success }
export function HapusRecordButton({
  id,
  action,
  label,
}: {
  id: string
  action: (id: string) => Promise<{ error?: string } | { success: true }>
  label: string
}) {
  const { confirm } = useConfirm()
  const [pending, startTransition] = useTransition()

  async function onClick(e: React.MouseEvent) {
    e.stopPropagation()
    const ok = await confirm({
      title: `Hapus ${label}`,
      message: `Yakin ingin menghapus ${label} ini? Tindakan ini tidak dapat dibatalkan.`,
      variant: 'danger',
      confirmText: 'Hapus',
    })
    if (!ok) return
    startTransition(async () => {
      try {
        const res = await action(id)
        if ('error' in res && res.error) toast.error(res.error)
        else toast.success(`${label} dihapus`)
      } catch {
        toast.error('Terjadi kesalahan')
      }
    })
  }

  return (
    <button
      type="button"
      aria-label="Hapus"
      title="Hapus"
      disabled={pending}
      onClick={onClick}
      className="cursor-pointer shrink-0 w-10 h-10 rounded-full inline-flex items-center justify-center opacity-60 hover:opacity-100 hover:bg-black/5 disabled:opacity-30 transition"
    >
      <Trash2 size={15} />
    </button>
  )
}
