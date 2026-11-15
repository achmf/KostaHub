'use client'

import { useState, useTransition } from 'react'
import { KeyRound } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ToastProvider'
import { resetPasswordUser } from '@/actions/admin'

export default function ResetPasswordButton({ user }: { user: { id: string; name: string } }) {
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [pending, startTransition] = useTransition()
  const inputId = `reset-pw-${user.id}`

  const close = () => { setOpen(false); setPassword('') }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      try {
        const res = await resetPasswordUser(user.id, password)
        if (res.error) return showToast({ title: res.error, type: 'error' })
        close()
        showToast({ title: `Password ${user.name} berhasil direset`, type: 'success' })
      } catch {
        showToast({ title: 'Gagal mereset password', type: 'error' })
      }
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-black/[0.04]"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#2C5F8A' }}
      >
        <KeyRound size={13} /> Reset password
      </button>
      <Modal open={open} onClose={close} title="Reset password" description={`Atur password baru untuk ${user.name}.`}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor={inputId} className="block mb-1.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: '#0D140F' }}>
              Password baru
            </label>
            <input
              id={inputId}
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-3 py-2"
              style={{ border: '1px solid rgba(13,20,15,0.09)', fontSize: 14 }}
            />
            <p className="mt-1" style={{ fontSize: 11.5, color: 'rgba(13,20,15,0.5)' }}>Minimal 6 karakter.</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={close}>Batal</Button>
            <Button type="submit" disabled={pending}>{pending ? 'Menyimpan...' : 'Reset password'}</Button>
          </div>
        </form>
      </Modal>
    </>
  )
}
