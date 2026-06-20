import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import {
  Building2,
  MapPin,
  Users,
  Activity,
  Calendar,
  ArrowLeft,
  Heart,
  Baby,
  TrendingUp,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'

const palette = {
  cream: '#F2EDE0',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.09)',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  danger: '#B5443B',
  info: '#2C5F8A',
}

export default async function AdminFarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const farm = await prisma.farm.findUnique({
    where: { id },
    include: {
      members: {
        where: { user: { deletedAt: null } },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true, approvalStatus: true },
          }
        },
      },
      hewan: {
        where: { status: 'AKTIF' },
        select: {
          id: true,
          tag: true,
          nama: true,
          kategori: true,
          kelamin: true,
          tanggalLahir: true,
          berat: true,
          status: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      _count: {
        select: {
          hewan: true,
          members: true,
        },
      },
    },
  })

  if (!farm) notFound()

  // Extra stats
  const [mati, terjual, hamil, rekamMedisCount] = await Promise.all([
    prisma.hewan.count({ where: { farmId: id, status: 'MATI' } }),
    prisma.hewan.count({ where: { farmId: id, status: 'TERJUAL' } }),
    prisma.reproduksi.count({ where: { induk: { farmId: id }, status: 'HAMIL' } }),
    prisma.rekamMedis.count({ where: { hewan: { farmId: id } } }),
  ])

  const totalSemua = farm._count.hewan + mati + terjual
  const mortalityRate = totalSemua > 0 ? Math.round((mati / totalSemua) * 100) : 0

  const roleBadge: Record<string, { label: string; color: string; bg: string }> = {
    OWNER: { label: 'Owner', color: palette.ochre, bg: 'rgba(199,135,62,0.12)' },
    PETUGAS: { label: 'Petugas', color: palette.info, bg: 'rgba(44,95,138,0.10)' },
    DOKTER: { label: 'Dokter', color: palette.moss, bg: 'rgba(63,91,58,0.10)' },
    SUPER_ADMIN: { label: 'Admin', color: palette.danger, bg: 'rgba(181,68,59,0.08)' },
  }

  const kategoriLabel: Record<string, string> = {
    INDUKAN: 'Indukan',
    PEJANTAN: 'Pejantan',
    ANAKAN: 'Anakan',
    DARA: 'Dara',
    JANTAN_MUDA: 'Jantan Muda',
  }

  return (
    <div>
      {/* Back + header */}
      <div className="mb-8">
        <Link
          href="/admin/farms"
          className="inline-flex items-center gap-1.5 mb-5 transition-opacity hover:opacity-70"
          style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.55)' }}
        >
          <ArrowLeft size={13} /> Kembali ke Semua Farm
        </Link>

        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 8 }}>
          DETAIL FARM
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: '-0.025em' }}>
              {farm.nama}
            </h1>
            <div className="flex items-center gap-3 mt-2 flex-wrap">
              {farm.alamat && (
                <div className="flex items-center gap-1.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>
                  <MapPin size={12} /> {farm.alamat}
                </div>
              )}
              <div className="flex items-center gap-1.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>
                <Calendar size={12} /> Terdaftar {new Date(farm.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
          </div>
          <span
            className="px-3 py-1.5 rounded-full"
            style={{
              background: farm.status === 'AKTIF' ? 'rgba(63,91,58,0.12)' : 'rgba(181,68,59,0.09)',
              color: farm.status === 'AKTIF' ? palette.moss : palette.danger,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              letterSpacing: '0.15em',
            }}
          >
            {farm.status}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
        {[
          { label: 'Hewan Aktif', value: farm._count.hewan, icon: Activity, color: palette.ochre, bg: 'rgba(199,135,62,0.10)' },
          { label: 'Hewan Mati', value: mati, icon: Heart, color: palette.danger, bg: 'rgba(181,68,59,0.08)' },
          { label: 'Terjual', value: terjual, icon: TrendingUp, color: palette.moss, bg: 'rgba(63,91,58,0.10)' },
          { label: 'Sedang Hamil', value: hamil, icon: Baby, color: palette.ochre, bg: 'rgba(199,135,62,0.08)' },
          { label: 'Rekam Medis', value: rekamMedisCount, icon: FileText, color: palette.info, bg: 'rgba(44,95,138,0.10)' },
          { label: 'Mortality Rate', value: `${mortalityRate}%`, icon: Heart, color: mortalityRate > 10 ? palette.danger : palette.moss, bg: mortalityRate > 10 ? 'rgba(181,68,59,0.08)' : 'rgba(63,91,58,0.10)' },
        ].map((stat) => {
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daftar Hewan (preview) */}
        <div className="rounded-2xl p-6" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 4 }}>
                POPULASI FARM
              </div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500 }}>Hewan Aktif ({farm._count.hewan})</div>
            </div>
            <Activity size={16} style={{ color: palette.ochre, opacity: 0.7 }} />
          </div>
          {farm.hewan.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="Tidak ada hewan aktif"
            />
          ) : (
            <div className="space-y-2.5">
              {farm.hewan.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                  style={{ border: `1px solid ${palette.border}` }}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center"
                      style={{ background: 'rgba(199,135,62,0.10)' }}
                    >
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: palette.ochre }}>
                        {h.kelamin === 'JANTAN' ? '♂' : '♀'}
                      </span>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: 500 }}>
                        {h.nama || h.tag}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.45)' }}>
                        #{h.tag}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(199,135,62,0.10)',
                        color: palette.ochre,
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 8,
                        letterSpacing: '0.08em',
                      }}
                    >
                      {kategoriLabel[h.kategori] || h.kategori}
                    </span>
                    {h.berat && (
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(13,20,15,0.45)' }}>
                        {h.berat} kg
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {farm._count.hewan > 10 && (
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.45)', textAlign: 'center', paddingTop: 8 }}>
                  + {farm._count.hewan - 10} hewan lainnya
                </div>
              )}
            </div>
          )}
        </div>

        {/* Daftar User/Staf */}
        <div className="rounded-2xl p-6" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 4 }}>
                TIM FARM
              </div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500 }}>Staf Terdaftar ({farm._count.members})</div>
            </div>
            <Users size={16} style={{ color: palette.ochre, opacity: 0.7 }} />
          </div>
          {farm.members.length === 0 ? (
            <EmptyState
              icon={Users}
              title="Belum ada staf"
            />
          ) : (
            <div className="space-y-2.5">
              {farm.members.map((uf) => {
                const u = uf.user
                const badge = roleBadge[u.role] || { label: u.role, color: palette.ink, bg: 'rgba(13,20,15,0.06)' }
                return (
                  <div
                    key={u.id}
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                    style={{ border: `1px solid ${palette.border}` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center"
                        style={{ background: badge.bg, color: badge.color, fontFamily: "'Fraunces',serif", fontSize: 12, fontWeight: 600 }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: 500 }}>{u.name}</div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(13,20,15,0.45)' }}>{u.email}</div>
                      </div>
                    </div>
                    <span
                      className="px-2 py-0.5 rounded-full"
                      style={{ background: badge.bg, color: badge.color, fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.08em' }}
                    >
                      {badge.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Deskripsi farm */}
      {farm.deskripsi && (
        <div className="mt-6 rounded-2xl p-6" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
          <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 10 }}>
            DESKRIPSI FARM
          </div>
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.7)', lineHeight: 1.6 }}>
            {farm.deskripsi}
          </p>
        </div>
      )}
    </div>
  )
}
