'use client'

import { useState, useTransition } from 'react'
import { deleteUser } from '@/actions/admin'
import { User, Mail, Phone, Building2, Trash2 } from 'lucide-react'

const palette = {
  cream: '#F2EDE0',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.10)',
}

const ROLE_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  SUPER_ADMIN: { label: 'Super Admin', bg: 'rgba(181,68,59,0.1)', color: '#B5443B' },
  OWNER: { label: 'Owner', bg: 'rgba(199,135,62,0.15)', color: palette.ochre },
  PETUGAS: { label: 'Petugas', bg: 'rgba(63,91,58,0.12)', color: '#3F5B3A' },
  DOKTER: { label: 'Dokter', bg: 'rgba(59,130,181,0.12)', color: '#3B82B5' },
}

type UserItem = {
  id: string
  name: string
  email: string
  role: string
  phone: string | null
  createdAt: Date
  farm: { id: string; nama: string } | null
}

export default function UserList({ users }: { users: UserItem[] }) {
  const [filter, setFilter] = useState('ALL')
  const [isPending, startTransition] = useTransition()

  const filtered = filter === 'ALL' ? users : users.filter((u) => u.role === filter)

  function handleDelete(userId: string, userName: string) {
    if (!confirm(`Hapus user "${userName}"? Tindakan ini tidak bisa dibatalkan.`)) return
    startTransition(async () => {
      await deleteUser(userId)
    })
  }

  return (
    <div>
      {/* Filter pills */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
        {['ALL', 'SUPER_ADMIN', 'OWNER', 'PETUGAS', 'DOKTER'].map((role) => (
          <button
            key={role}
            onClick={() => setFilter(role)}
            className="cursor-pointer px-4 py-2 rounded-full transition-all"
            style={{
              background: filter === role ? palette.ink : 'rgba(13,20,15,0.04)',
              color: filter === role ? palette.cream : 'rgba(13,20,15,0.6)',
              fontFamily: "'Inter',sans-serif",
              fontSize: 12,
              border: `1px solid ${filter === role ? palette.ink : palette.border}`,
            }}
          >
            {role === 'ALL' ? 'Semua' : ROLE_LABELS[role]?.label ?? role}
            {role === 'ALL' && ` (${users.length})`}
            {role !== 'ALL' && ` (${users.filter((u) => u.role === role).length})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
        <table className="w-full" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${palette.border}` }}>
              {['User', 'Role', 'Farm', 'Terdaftar', ''].map((h) => (
                <th
                  key={h}
                  className="px-5 py-3.5 text-left"
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    letterSpacing: '0.15em',
                    color: 'rgba(13,20,15,0.4)',
                    fontWeight: 500,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => {
              const roleInfo = ROLE_LABELS[user.role] ?? { label: user.role, bg: 'rgba(0,0,0,0.05)', color: palette.ink }
              return (
                <tr key={user.id} className="border-t" style={{ borderColor: palette.border }}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: palette.ochre, color: palette.ink, fontFamily: "'Fraunces',serif", fontSize: 13 }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 500 }}>{user.name}</div>
                        <div className="flex items-center gap-1 mt-0.5" style={{ fontSize: 11, color: 'rgba(13,20,15,0.4)' }}>
                          <Mail size={10} />{user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className="px-2.5 py-1 rounded-full"
                      style={{ background: roleInfo.bg, color: roleInfo.color, fontSize: 11, fontWeight: 500 }}
                    >
                      {roleInfo.label}
                    </span>
                  </td>
                  <td className="px-5 py-4" style={{ color: 'rgba(13,20,15,0.6)' }}>
                    {user.farm?.nama ?? '—'}
                  </td>
                  <td className="px-5 py-4" style={{ color: 'rgba(13,20,15,0.4)', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-5 py-4">
                    {user.role !== 'SUPER_ADMIN' && (
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        disabled={isPending}
                        className="cursor-pointer p-2 rounded-lg transition-all hover:bg-red-50"
                        style={{ color: 'rgba(181,68,59,0.5)' }}
                        title="Hapus user"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
