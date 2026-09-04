'use client'

import { Users, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import PaginationControl from './PaginationControl'
import { usePagination } from '@/hooks/usePagination'

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

export default function AdminUsersClient({ users }: { users: any[] }) {
  const { paged: currentUsers, page, totalPages, onPrev, onNext } = usePagination(users, PER_PAGE)

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${palette.border}`, background: '#fff' }}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: `1px solid ${palette.border}`, background: 'rgba(13,20,15,0.02)' }}>
              {['User', 'Role', 'Farm', 'Status', 'Bergabung'].map((col) => (
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
              const ab = approvalBadge[user.approvalStatus] || approvalBadge.PENDING
              const ApprovalIcon = ab.icon
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

                  {/* Status */}
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <ApprovalIcon size={11} style={{ color: ab.color }} />
                      <span
                        style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: ab.color, letterSpacing: '0.08em' }}
                      >
                        {ab.label}
                      </span>
                    </div>
                  </td>

                  {/* Bergabung */}
                  <td className="px-5 py-4">
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(13,20,15,0.45)' }}>
                      {new Date(user.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {users.length === 0 && (
        <EmptyState
          icon={Users}
          title="Belum ada user"
          description="User yang mendaftar ke sistem akan muncul di sini."
        />
      )}

      {users.length > 0 && (
        <div className="px-5 pb-5">
          <PaginationControl 
            page={page}
            totalPages={totalPages}
            onPrev={onPrev}
            onNext={onNext}
            totalItems={users.length}
            perPage={PER_PAGE}
          />
        </div>
      )}
    </div>
  )
}
