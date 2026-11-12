'use client'

import { useState, useTransition } from 'react'
import { Users, Clock, CheckCircle2, XCircle, KeyRound } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ToastProvider'
import { resetPasswordUser } from '@/actions/admin'
import { EmptyState } from '@/components/ui/EmptyState'
import PaginationControl from './PaginationControl'
import { usePagination } from '@/hooks/usePagination'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/Layout/SearchBar'
import { FilterSheet } from '@/components/Layout/FilterSheet'

const palette = {
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.09)',
  moss: '#3F5B3A',
  danger: '#B5443B',
  info: '#2C5F8A',
}

const roleBadge: Record<string, { label: string; color: string; bg: string }> = {
  OWNER: { label: 'Owner', color: '#A0692B', bg: 'rgba(199,135,62,0.12)' },
  PETUGAS: { label: 'Petugas', color: '#2C5F8A', bg: 'rgba(44,95,138,0.10)' },
  SUPER_ADMIN: { label: 'Super Admin', color: '#B5443B', bg: 'rgba(181,68,59,0.08)' },
  DINAS: { label: 'Dinas', color: '#1E78A0', bg: 'rgba(30,120,160,0.08)' },
}

const approvalBadge: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  APPROVED: { label: 'Disetujui', color: palette.moss, bg: 'rgba(63,91,58,0.10)', icon: CheckCircle2 },
  PENDING: { label: 'Pending', color: '#9B6A1E', bg: 'rgba(199,135,62,0.12)', icon: Clock },
  REJECTED: { label: 'Ditolak', color: palette.danger, bg: 'rgba(181,68,59,0.08)', icon: XCircle },
}

const PER_PAGE = 10

function ResetPasswordButton({ user }: { user: { id: string; name: string } }) {
  const { showToast } = useToast()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [pending, startTransition] = useTransition()
  const inputId = `reset-pw-${user.id}`

  const close = () => { setOpen(false); setPassword('') }
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      const res = await resetPasswordUser(user.id, password)
      if (res.error) return showToast({ title: res.error, type: 'error' })
      close()
      showToast({ title: `Password ${user.name} berhasil direset`, type: 'success' })
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-black/[0.04]"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.info }}
      >
        <KeyRound size={13} /> Reset password
      </button>
      <Modal open={open} onClose={close} title="Reset password" description={`Atur password baru untuk ${user.name}.`}>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label htmlFor={inputId} className="block mb-1.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: palette.ink }}>
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
              style={{ border: `1px solid ${palette.border}`, fontSize: 14 }}
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

export default function AdminUsersClient({ users }: { users: any[] }) {
  const searchParams = useSearchParams()
  const q = searchParams.get('q')?.toLowerCase() || ''
  const roleFilter = searchParams.get('role') || 'ALL'

  const filteredUsers = users.filter(u => {
    const matchQ = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter
    return matchQ && matchRole
  })

  const { paged: currentUsers, page, totalPages, onPrev, onNext } = usePagination(filteredUsers, PER_PAGE)

  return (
    <div>
      <div className="mb-5 flex flex-row items-center justify-between gap-3 sm:gap-4">
        <SearchBar placeholder="Cari nama atau email..." />
        <FilterSheet 
          filters={[
            {
              paramName: 'role',
              title: 'Role User',
              options: [
                { value: 'ALL', label: 'Semua Role' },
                { value: 'OWNER', label: 'Owner' },
                { value: 'PETUGAS', label: 'Petugas' },
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
                { value: 'DINAS', label: 'Dinas' }
              ]
            }
          ]} 
        />
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${palette.border}`, background: '#fff' }}>
        {currentUsers.length === 0 && (
          <EmptyState title="Tidak ada user" description="Belum ada data user yang sesuai pencarian." />
        )}
        {/* Mobile: kartu per user (tabel tampil mulai md) */}
        <div className="md:hidden">
        {currentUsers.map((user, i) => {
          const rb = roleBadge[user.role] || { label: user.role, color: palette.ink, bg: 'rgba(13,20,15,0.06)' }
          return (
            <div
              key={user.id}
              className="flex items-start gap-3 px-4 py-4"
              style={{ borderBottom: i < currentUsers.length - 1 ? `1px solid ${palette.border}` : 'none' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{ background: rb.bg, color: rb.color, fontFamily: "'Fraunces',serif", fontSize: 13, fontWeight: 600 }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="break-words" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5, fontWeight: 500, color: palette.ink }}>
                      {user.name}
                    </div>
                    <div className="break-all" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: 'rgba(13,20,15,0.5)' }}>
                      {user.email}
                    </div>
                  </div>
                  <span
                    className="shrink-0 whitespace-nowrap px-2.5 py-1 rounded-full"
                    style={{ background: rb.bg, color: rb.color, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.10em' }}
                  >
                    {rb.label}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2">
                  {user.farms.length > 0 ? (
                    <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.ink }}>
                      {user.farms[0].farm.nama}
                      {user.farms.length > 1 && (
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.4)', marginLeft: 4 }}>
                          +{user.farms.length - 1} lagi
                        </span>
                      )}
                    </span>
                  ) : (
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.35)' }}>
                      — semua farm
                    </span>
                  )}
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(13,20,15,0.45)' }}>
                    Bergabung {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
                <div className="mt-2 -ml-2.5"><ResetPasswordButton user={user} /></div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${palette.border}`, background: 'rgba(13,20,15,0.02)' }}>
              {['User', 'Role', 'Farm', 'Bergabung', 'Aksi'].map((col) => (
                <th
                  key={col}
                  className="text-left px-5 py-3.5"
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.45)', fontWeight: 400 }}
                >
                  {col.toUpperCase()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentUsers.map((user, i) => {
              const rb = roleBadge[user.role] || { label: user.role, color: palette.ink, bg: 'rgba(13,20,15,0.06)' }
              return (
                <tr
                  key={user.id}
                  style={{
                    borderBottom: i < currentUsers.length - 1 ? `1px solid ${palette.border}` : 'none',
                  }}
                  className="hover:bg-black/[0.015] transition-colors"
                >
                  {/* User */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: rb.bg, color: rb.color, fontFamily: "'Fraunces',serif", fontSize: 13, fontWeight: 600 }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5, fontWeight: 500, color: palette.ink }}>
                          {user.name}
                        </div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: 'rgba(13,20,15,0.5)' }}>
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="px-5 py-4">
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{ background: rb.bg, color: rb.color, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.10em' }}
                    >
                      {rb.label}
                    </span>
                  </td>

                  {/* Farm */}
                  <td className="px-5 py-4">
                    {user.farms.length > 0 ? (
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}>
                        {user.farms[0].farm.nama}
                        {user.farms.length > 1 && (
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.4)', marginLeft: 4 }}>
                            +{user.farms.length - 1} lagi
                          </span>
                        )}
                      </span>
                    ) : (
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.35)' }}>
                        — semua farm
                      </span>
                    )}
                  </td>

                  {/* Bergabung */}
                  <td className="px-5 py-4">
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(13,20,15,0.45)' }}>
                      {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>

                  {/* Aksi */}
                  <td className="px-5 py-4">
                    <ResetPasswordButton user={user} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <EmptyState
          icon={Users}
          title="Tidak ada user"
          description="Belum ada user yang sesuai dengan pencarian atau filter."
        />
      )}

      {filteredUsers.length > 0 && (
        <div className="px-5 pb-5">
          <PaginationControl 
            page={page}
            totalPages={totalPages}
            onPrev={onPrev}
            onNext={onNext}
            totalItems={filteredUsers.length}
            perPage={PER_PAGE}
          />
        </div>
      )}
    </div>
    </div>
  )
}
