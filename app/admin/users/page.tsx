import { prisma } from '@/lib/prisma'
import { Users, ShieldCheck, Stethoscope, UserCog, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'

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
  DOKTER: { label: 'Dokter', color: '#3F5B3A', bg: 'rgba(63,91,58,0.10)' },
  SUPER_ADMIN: { label: 'Super Admin', color: '#B5443B', bg: 'rgba(181,68,59,0.08)' },
}

const approvalBadge: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  APPROVED: { label: 'Disetujui', color: palette.moss, bg: 'rgba(63,91,58,0.10)', icon: CheckCircle2 },
  PENDING: { label: 'Pending', color: '#9B6A1E', bg: 'rgba(199,135,62,0.12)', icon: Clock },
  REJECTED: { label: 'Ditolak', color: palette.danger, bg: 'rgba(181,68,59,0.08)', icon: XCircle },
}

export default async function AdminUsersPage() {
  const users = await prisma.user.findMany({
    where: { deletedAt: null },
    include: {
      farms: {
        include: { farm: { select: { id: true, nama: true } } },
        orderBy: { assignedAt: 'asc' },
        take: 3, // ambil max 3 farm untuk ditampilkan
      }
    },
    orderBy: { createdAt: 'desc' },
  })

  const totalOwner = users.filter((u) => u.role === 'OWNER').length
  const totalPetugas = users.filter((u) => u.role === 'PETUGAS').length
  const totalDokter = users.filter((u) => u.role === 'DOKTER').length
  const totalPending = users.filter((u) => u.approvalStatus === 'PENDING').length

  const stats = [
    { label: 'Total User', value: users.length, icon: Users, color: palette.ochre, bg: 'rgba(199,135,62,0.10)' },
    { label: 'Owner', value: totalOwner, icon: UserCog, color: '#A0692B', bg: 'rgba(199,135,62,0.12)' },
    { label: 'Petugas', value: totalPetugas, icon: ShieldCheck, color: palette.info, bg: 'rgba(44,95,138,0.10)' },
    { label: 'Dokter', value: totalDokter, icon: Stethoscope, color: palette.moss, bg: 'rgba(63,91,58,0.10)' },
    { label: 'Pending Approval', value: totalPending, icon: Clock, color: totalPending > 0 ? palette.danger : palette.moss, bg: totalPending > 0 ? 'rgba(181,68,59,0.08)' : 'rgba(63,91,58,0.10)' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 8 }}>
          MANAJEMEN USER
        </div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: '-0.025em' }}>
          Semua <span style={{ fontStyle: 'italic', color: palette.ochre }}>User</span>
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.55)', marginTop: 4 }}>
          Daftar semua user terdaftar di seluruh farm ({users.length} total).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="p-4 rounded-2xl"
              style={{ background: '#fff', border: `1px solid ${palette.border}` }}
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: stat.bg }}>
                <Icon size={15} style={{ color: stat.color }} />
              </div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 400, color: palette.ink }}>
                {stat.value}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.12em', color: 'rgba(13,20,15,0.45)', marginTop: 4 }}>
                {stat.label.toUpperCase()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Table */}
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
              {users.map((user, i) => {
                const rb = roleBadge[user.role] || { label: user.role, color: palette.ink, bg: 'rgba(13,20,15,0.06)' }
                const ab = approvalBadge[user.approvalStatus] || approvalBadge.PENDING
                const ApprovalIcon = ab.icon
                return (
                  <tr
                    key={user.id}
                    style={{
                      borderBottom: i < users.length - 1 ? `1px solid ${palette.border}` : 'none',
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
      </div>
    </div>
  )
}
