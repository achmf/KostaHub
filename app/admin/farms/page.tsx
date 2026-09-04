import { prisma } from '@/lib/prisma'
import { Building2, Users, Activity, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'

import AdminFarmsHeader from '@/components/Admin/AdminFarmsHeader'

const palette = {
  cream: '#F2EDE0',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.09)',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  danger: '#B5443B',
}

export default async function AdminFarmsPage() {
  const farms = await prisma.farm.findMany({
    include: {
      _count: { select: { members: true, hewan: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  const farmAktif = farms.filter((f) => f.status === 'AKTIF').length
  const farmNonaktif = farms.filter((f) => f.status === 'NONAKTIF').length
  const totalHewan = farms.reduce((sum, f) => sum + f._count.hewan, 0)
  const totalUser = farms.reduce((sum, f) => sum + f._count.members, 0)
  const avgHewan = farms.length > 0 ? Math.round(totalHewan / farms.length) : 0

  const stats = [
    { label: 'Total Farm', value: farms.length, icon: Building2, color: palette.ochre, bg: 'rgba(199,135,62,0.10)' },
    { label: 'Farm Aktif', value: farmAktif, icon: CheckCircle2, color: palette.moss, bg: 'rgba(63,91,58,0.10)' },
    { label: 'Farm Nonaktif', value: farmNonaktif, icon: AlertTriangle, color: palette.danger, bg: 'rgba(181,68,59,0.08)' },
    { label: 'Total Hewan', value: totalHewan, icon: Activity, color: palette.ochre, bg: 'rgba(199,135,62,0.10)' },
    { label: 'Total User', value: totalUser, icon: Users, color: '#2C5F8A', bg: 'rgba(44,95,138,0.10)' },
    { label: 'Rata-rata Hewan/Farm', value: avgHewan, icon: Activity, color: palette.moss, bg: 'rgba(63,91,58,0.10)' },
  ]

  return (
    <div>
      {/* Header */}
      <AdminFarmsHeader />

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
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

      {/* Legend */}
      <div className="flex items-center gap-4 mb-5">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: palette.moss }} />
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.6)' }}>Aktif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: palette.danger }} />
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.6)' }}>Nonaktif</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(13,20,15,0.2)' }} />
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.6)' }}>Deleted</span>
        </div>
      </div>

      {/* Farm Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {farms.map((farm) => {
          const isAktif = farm.status === 'AKTIF'
          const isNonaktif = farm.status === 'NONAKTIF'
          return (
            <Link
              key={farm.id}
              href={`/admin/farms/${farm.id}`}
              className="block group rounded-2xl p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
              style={{ background: '#fff', border: `1px solid ${palette.border}` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: isAktif ? 'rgba(63,91,58,0.10)' : 'rgba(181,68,59,0.08)' }}
                >
                  <Building2 size={19} style={{ color: isAktif ? palette.moss : palette.danger }} />
                </div>
                <span
                  className="px-2.5 py-1 rounded-full"
                  style={{
                    background: isAktif ? 'rgba(63,91,58,0.10)' : isNonaktif ? 'rgba(181,68,59,0.08)' : 'rgba(13,20,15,0.06)',
                    color: isAktif ? palette.moss : isNonaktif ? palette.danger : 'rgba(13,20,15,0.45)',
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 8,
                    letterSpacing: '0.12em',
                  }}
                >
                  {farm.status === 'AKTIF' ? 'Aktif' : farm.status === 'NONAKTIF' ? 'Nonaktif' : farm.status}
                </span>
              </div>

              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 500, color: palette.ink }}>
                {farm.nama}
              </div>

              {farm.alamat && (
                <div className="flex items-center gap-1.5 mt-1.5" style={{ fontSize: 12, color: 'rgba(13,20,15,0.45)', fontFamily: "'Inter',sans-serif" }}>
                  <MapPin size={11} />{farm.alamat}
                </div>
              )}

              <div
                className="flex items-center gap-5 mt-4 pt-4"
                style={{ borderTop: `1px solid ${palette.border}` }}
              >
                <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'rgba(13,20,15,0.5)', fontFamily: "'Inter',sans-serif" }}>
                  <Activity size={12} style={{ color: palette.ochre }} />
                  <span style={{ fontWeight: 600, color: palette.ink }}>{farm._count.hewan}</span> hewan
                </div>
                <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'rgba(13,20,15,0.5)', fontFamily: "'Inter',sans-serif" }}>
                  <Users size={12} style={{ color: palette.ochre }} />
                  <span style={{ fontWeight: 600, color: palette.ink }}>{farm._count.members}</span> user
                </div>
                {farm.createdAt && (
                  <div className="ml-auto" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.35)' }}>
                    {new Date(farm.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
            </Link>
          )
        })}
      </div>

      {farms.length === 0 && (
        <EmptyState
          icon={Building2}
          title="Belum ada farm terdaftar"
          description="Farm yang didaftarkan owner akan muncul di sini."
        />
      )}
    </div>
  )
}
