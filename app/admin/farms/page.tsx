import { prisma } from '@/lib/prisma'
import { Building2, Users, MapPin } from 'lucide-react'

const palette = {
  cream: '#F2EDE0',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.10)',
  forest: '#1B2A1F',
}

export default async function AdminFarmsPage() {
  const farms = await prisma.farm.findMany({
    include: {
      _count: { select: { users: true, hewan: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      <div className="mb-8">
        <div
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            letterSpacing: '0.2em',
            color: 'rgba(13,20,15,0.5)',
            marginBottom: 6,
          }}
        >
          BACKOFFICE
        </div>
        <h1
          style={{
            fontFamily: "'Fraunces',serif",
            fontSize: 'clamp(1.5rem, 3vw, 2rem)',
            fontWeight: 400,
            letterSpacing: '-0.025em',
          }}
        >
          Overview Farm
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.6)', marginTop: 4 }}>
          Daftar semua farm yang terdaftar di sistem.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total Farm', value: farms.length, icon: Building2 },
          { label: 'Farm Aktif', value: farms.filter((f) => f.status === 'AKTIF').length, icon: Building2 },
          { label: 'Total Hewan', value: farms.reduce((sum, f) => sum + f._count.hewan, 0), icon: Users },
        ].map((stat) => (
          <div
            key={stat.label}
            className="p-5 rounded-2xl"
            style={{ background: '#fff', border: `1px solid ${palette.border}` }}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} style={{ color: palette.ochre }} />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.4)' }}>
                {stat.label.toUpperCase()}
              </span>
            </div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 400 }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Farm grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {farms.map((farm) => (
          <div
            key={farm.id}
            className="p-5 rounded-2xl"
            style={{ background: '#fff', border: `1px solid ${palette.border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(199,135,62,0.12)' }}
              >
                <Building2 size={18} style={{ color: palette.ochre }} />
              </div>
              <span
                className="px-2.5 py-1 rounded-full"
                style={{
                  background: farm.status === 'AKTIF' ? 'rgba(63,91,58,0.12)' : 'rgba(181,68,59,0.08)',
                  color: farm.status === 'AKTIF' ? '#3F5B3A' : '#B5443B',
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 9,
                  letterSpacing: '0.1em',
                }}
              >
                {farm.status}
              </span>
            </div>

            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 15, fontWeight: 500 }}>{farm.nama}</div>
            {farm.alamat && (
              <div className="flex items-center gap-1.5 mt-1.5" style={{ fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
                <MapPin size={11} />{farm.alamat}
              </div>
            )}

            <div className="flex items-center gap-4 mt-4 pt-4" style={{ borderTop: `1px solid ${palette.border}` }}>
              <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
                <Users size={12} />
                <span style={{ fontWeight: 500, color: palette.ink }}>{farm._count.users}</span> user
              </div>
              <div className="flex items-center gap-1.5" style={{ fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
                <span style={{ fontWeight: 500, color: palette.ink }}>{farm._count.hewan}</span> hewan
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
