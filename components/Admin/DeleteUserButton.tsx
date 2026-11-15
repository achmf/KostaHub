'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { useToast } from '@/components/ToastProvider'
import { useConfirm } from '@/components/ConfirmProvider'
import { deleteUser } from '@/actions/admin'

export default function DeleteUserButton({ user }: { user: { id: string; name: string } }) {
  const router = useRouter()
  const { showToast } = useToast()
  const { confirm } = useConfirm()
  const [pending, startTransition] = useTransition()

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Hapus user?',
      message: `Akun ${user.name} akan dinonaktifkan dan tidak bisa login lagi.`,
      confirmText: 'Ya, Hapus',
      variant: 'danger',
    })
    if (!ok) return
    startTransition(async () => {
      try {
        const res = await deleteUser(user.id)
        if (res.error) return showToast({ title: res.error, type: 'error' })
        showToast({ title: `${user.name} berhasil dihapus`, type: 'success' })
        router.refresh()
      } catch {
        showToast({ title: 'Gagal menghapus user', type: 'error' })
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-black/[0.04] disabled:opacity-50"
      style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#B5443B' }}
    >
      <Trash2 size={13} /> {pending ? 'Menghapus...' : 'Hapus'}
    </button>
  )
}
