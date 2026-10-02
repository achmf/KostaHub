import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import {
  MapPin,
  Users,
  Activity,
  Calendar,
  ArrowLeft,
  Heart,
  Dna,
  TrendingUp,
  Stethoscope,
  HeartCrack,
  ArrowRightLeft,
  ExternalLink,
  FileText,
} from 'lucide-react'
import Link from 'next/link'
import { EmptyState } from '@/components/ui/EmptyState'
import AdminFarmProfileActions from '@/components/Admin/AdminFarmProfileActions'
import { getSession } from '@/lib/auth'
import AdminFarmDetailHewanList from '@/components/Admin/AdminFarmDetailHewanList'
import AdminFarmPopulasiChart from '@/components/Admin/AdminFarmPopulasiChart'
import { KostaCard, KostaSectionLabel, Badge } from '@/components/KostaUI'
import { palette } from '@/lib/palette'

// Extra palette tokens not exported from KostaUI
const extra = {
  info: '#2C5F8A',
  muted: 'rgba(13,20,15,0.45)',
  danger: '#B5443B',
  moss: '#3F5B3A',
}

const kategoriLabel: Record<string, string> = {
  INDUKAN: 'Indukan',
  PEJANTAN: 'Pejantan',
  ANAKAN: 'Anakan',
  DARA: 'Dara',
  JANTAN_MUDA: 'Jantan Muda',
}

const kategoriColor: Record<string, { color: string; bg: string }> = {
  INDUKAN: { color: '#B5443B', bg: 'rgba(181,68,59,0.10)' },
  PEJANTAN: { color: '#2C5F8A', bg: 'rgba(44,95,138,0.10)' },
  ANAKAN: { color: '#C7873E', bg: 'rgba(199,135,62,0.12)' },
  DARA: { color: '#5A7A4E', bg: 'rgba(90,122,78,0.12)' },
  JANTAN_MUDA: { color: '#7A6C4E', bg: 'rgba(122,108,78,0.12)' },
}

const kategoriMedisLabel: Record<string, string> = {
  VAKSINASI: 'Vaksinasi',
  PENGOBATAN: 'Pengobatan',
  PENGOBATAN_INFEKSI: 'Infeksi',
  PENGOBATAN_PARASIT: 'Parasit',
  PEMERIKSAAN: 'Pemeriksaan',
  PEMERIKSAAN_RUTIN: 'Pemeriksaan Rutin',
  PERAWATAN_LUKA: 'Perawatan Luka',
  VITAMIN: 'Vitamin',
  PARTUS: 'Partus',
  POTONG_KUKU: 'Potong Kuku',
  LAINNYA: 'Lainnya',
}

function StatTile({ label, value, icon: Icon, color, bg }: {
  label: string; value: string | number; icon: React.ElementType; color: string; bg: string
}) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: bg }}>
        <Icon size={15} style={{ color }} />
      </div>
      <div style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontWeight: 400, color: palette.ink }}>
        {value}
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.12em', color: extra.muted, marginTop: 4 }}>
        {label.toUpperCase()}
      </div>
    </div>
  )
}

export default async function AdminFarmDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()

  const [farm, matiCount, hamilCount, rekamMedisCount, transferCount] = await Promise.all([
    prisma.farm.findUnique({
      where: { id },
      include: {
        members: {
          where: { user: { deletedAt: null } },
          include: {
            user: {
              select: { id: true, name: true, email: true, role: true, approvalStatus: true },
            },
          },
        },
        hewan: {
          select: {
            id: true,
            tag: true,
            nama: true,
            kategori: true,
            kelamin: true,
            tanggalLahir: true,
            berat: true,
            createdAt: true,
            kematian: { select: { tanggalMati: true, penyebab: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { hewan: true, members: true } },
      },
    }),
    prisma.kematianHewan.count({ where: { hewan: { farmId: id } } }),
    prisma.reproduksi.count({ where: { induk: { farmId: id }, status: 'HAMIL' } }),
    prisma.rekamMedis.count({ where: { hewan: { farmId: id } } }),
    prisma.transferHewan.count({ where: { OR: [{ fromFarmId: id }, { toFarmId: id }] } }),
  ])

  if (!farm) notFound()

  const [rekamMedisTerbaru, reproduksiList, transferList, owners] = await Promise.all([
    prisma.rekamMedis.findMany({
      where: { hewan: { farmId: id } },
      include: { hewan: { select: { nama: true, tag: true } } },
      orderBy: { tanggal: 'desc' },
      take: 8,
    }),
    prisma.reproduksi.findMany({
      where: { induk: { farmId: id } },
      include: {
        induk: { select: { nama: true, tag: true } },
        pejantan: { select: { nama: true, tag: true } },
      },
      orderBy: { tanggalKawin: 'desc' },
      take: 10,
    }),
    prisma.transferHewan.findMany({
      where: { OR: [{ fromFarmId: id }, { toFarmId: id }] },
      include: {
        hewan: { select: { nama: true, tag: true } },
        fromFarm: { select: { nama: true } },
        toFarm: { select: { nama: true } },
      },
      orderBy: { tanggal: 'desc' },
      take: 8,
    }),
    prisma.user.findMany({
      where: { role: 'OWNER' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    }),
  ])

  const totalSemua = farm._count.hewan
  const hewanHidup = totalSemua - matiCount
  const mortalityRate = totalSemua > 0 ? Math.round((matiCount / totalSemua) * 100) : 0
  const hidupList = farm.hewan.filter(h => !h.kematian)
  const byKategori = Object.entries(
    hidupList.reduce<Record<string, number>>((acc, h) => {
      acc[h.kategori] = (acc[h.kategori] ?? 0) + 1
      return acc
    }, {})
  ).sort(([, a], [, b]) => b - a)
  const hewanDenganBerat = hidupList.filter(h => h.berat)
  const ratarataBerat = hewanDenganBerat.length > 0
    ? Math.round(hewanDenganBerat.reduce((s, h) => s + h.berat!, 0) / hewanDenganBerat.length * 10) / 10
    : null
  const currentOwnerId = farm.members.find(m => m.user.role === 'OWNER')?.user.id ?? ''
  const roleBadgeVariant: Record<string, 'ochre' | 'moss' | 'rose'> = {
    OWNER: 'ochre',
    PETUGAS: 'moss',
    SUPER_ADMIN: 'rose',
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/farms"
          className="inline-flex items-center gap-1.5 min-h-10 sm:min-h-0 mb-3 sm:mb-5 transition-opacity hover:opacity-70"
          style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.55)' }}
        >
          <ArrowLeft size={13} /> Kembali ke Semua Farm
        </Link>
        <KostaSectionLabel style={{ fontSize: 9, letterSpacing: '0.2em', marginBottom: 4 }}>
          DETAIL FARM
        </KostaSectionLabel>
        {/* Title row: nama + status badge inline */}
        <div className="flex items-center gap-2.5 flex-wrap mb-2">
          <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
            {farm.nama}
          </h1>
          <Badge variant={farm.status === 'AKTIF' ? 'emerald' : 'rose'}>
            {farm.status === 'AKTIF' ? 'Aktif' : farm.status === 'NONAKTIF' ? 'Nonaktif' : farm.status}
          </Badge>
        </div>

        {/* Meta row: alamat, tanggal, maps */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          {farm.alamat && (
            <div className="flex items-start gap-1.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: extra.muted }}>
              <MapPin size={12} className="shrink-0 mt-0.5" /> {farm.alamat}
            </div>
          )}
          <div className="flex items-center gap-1.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: extra.muted }}>
            <Calendar size={12} /> Terdaftar {new Date(farm.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {farm.lat && farm.lng && (
            <a
              href={`https://www.google.com/maps?q=${farm.lat},${farm.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 hover:opacity-70 transition-opacity"
              style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: extra.info }}
            >
              <ExternalLink size={11} /> Lihat di Maps
            </a>
          )}
        </div>

        {/* Action buttons row */}
        <AdminFarmProfileActions
          canEdit={session?.role === 'SUPER_ADMIN'}
          farm={{ id: farm.id, nama: farm.nama, alamat: farm.alamat, deskripsi: farm.deskripsi, lat: farm.lat, lng: farm.lng, status: farm.status }}
          owners={owners}
          currentOwnerId={currentOwnerId}
        />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatTile label="Hewan Hidup" value={hewanHidup} icon={Activity} color={palette.ochre} bg="rgba(199,135,62,0.10)" />
        <StatTile label="Hewan Mati" value={matiCount} icon={HeartCrack} color={extra.danger} bg="rgba(181,68,59,0.08)" />
        <StatTile label="Sedang Hamil" value={hamilCount} icon={Dna} color={palette.ochre} bg="rgba(199,135,62,0.08)" />
        <StatTile label="Rekam Medis" value={rekamMedisCount} icon={Stethoscope} color={extra.info} bg="rgba(44,95,138,0.10)" />
        <StatTile label="Mortality Rate" value={`${mortalityRate}%`} icon={TrendingUp} color={mortalityRate > 10 ? extra.danger : extra.moss} bg={mortalityRate > 10 ? 'rgba(181,68,59,0.08)' : 'rgba(63,91,58,0.10)'} />
      </div>

      {/* Komposisi Populasi */}
      <KostaCard className="p-5 sm:p-8 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <KostaSectionLabel style={{ fontSize: 9, letterSpacing: '0.2em', marginBottom: 4 }}>KOMPOSISI POPULASI</KostaSectionLabel>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500 }}>Breakdown per Kategori</div>
          </div>
          <Activity size={16} style={{ color: palette.ochre, opacity: 0.7 }} />
        </div>
        {byKategori.length === 0 ? (
          <EmptyState icon={Activity} title="Tidak ada hewan hidup" />
        ) : (
          <AdminFarmPopulasiChart
            byKategori={byKategori}
            hewanHidup={hewanHidup}
            betina={hidupList.filter(h => h.kelamin === 'BETINA').length}
            jantan={hidupList.filter(h => h.kelamin === 'JANTAN').length}
            ratarataBerat={ratarataBerat}
          />
        )}
      </KostaCard>

      {/* Info Farm */}
      <KostaCard className="p-4 sm:p-6 mb-6">
        <KostaSectionLabel style={{ fontSize: 9, letterSpacing: '0.2em', marginBottom: 4 }}>INFO FARM</KostaSectionLabel>
        <div className="flex flex-col gap-4 mt-1">
          {farm.deskripsi && (
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: extra.muted, letterSpacing: '0.1em', marginBottom: 4 }}>DESKRIPSI</div>
              <p className="break-words" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.7)', lineHeight: 1.55 }}>{farm.deskripsi}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            {farm.lat && farm.lng && (
              <div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: extra.muted, letterSpacing: '0.1em', marginBottom: 4 }}>KOORDINAT GPS</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: palette.ink, lineHeight: 1.4 }}>
                  {farm.lat.toFixed(6)},<br />{farm.lng.toFixed(6)}
                </div>
              </div>
            )}
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: extra.muted, letterSpacing: '0.1em', marginBottom: 4 }}>HISTORY TRANSFER</div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, color: palette.ink, lineHeight: 1 }}>{transferCount} <span style={{ fontSize: 11, fontFamily: "'Inter',sans-serif" }}>transaksi</span></div>
            </div>
          </div>
          {farm.sertifikatUrl && (
            <div style={{ paddingTop: 4 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: extra.muted, letterSpacing: '0.1em', marginBottom: 6 }}>SERTIFIKAT</div>
              {farm.sertifikatUrl.match(/\.(jpg|jpeg|png|webp|gif)$/i) ? (
                <a href={farm.sertifikatUrl} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={farm.sertifikatUrl} alt="Sertifikat farm" className="w-full rounded-xl object-cover" style={{ maxHeight: 120, border: `1px solid ${palette.border}` }} />
                </a>
              ) : (
                <a href={farm.sertifikatUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-xl hover:opacity-80 transition-opacity" style={{ background: 'rgba(44,95,138,0.06)', border: `1px solid rgba(44,95,138,0.15)`, fontFamily: "'Inter',sans-serif", fontSize: 12, color: extra.info }}>
                  <FileText size={13} /> Lihat Sertifikat <ExternalLink size={11} />
                </a>
              )}
            </div>
          )}
          {!farm.deskripsi && !farm.sertifikatUrl && !farm.lat && (
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: extra.muted }}>Belum ada info tambahan.</div>
          )}
        </div>
      </KostaCard>

      {/* Daftar Hewan Lengkap dengan pagination */}
      <div className="mb-6">
        <AdminFarmDetailHewanList hewan={farm.hewan} />
      </div>

      {/* Rekam Medis + Reproduksi */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <KostaCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <KostaSectionLabel style={{ fontSize: 9, letterSpacing: '0.2em', marginBottom: 4 }}>KESEHATAN</KostaSectionLabel>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500 }}>Rekam Medis Terbaru</div>
            </div>
            <Stethoscope size={16} style={{ color: extra.info, opacity: 0.7 }} />
          </div>
          {rekamMedisTerbaru.length === 0 ? (
            <EmptyState icon={Stethoscope} title="Belum ada rekam medis" />
          ) : (
            <div className="space-y-2.5">
              {rekamMedisTerbaru.map((rm) => (
                <div key={rm.id} className="flex items-start gap-3 py-2.5 px-3 rounded-xl" style={{ border: `1px solid ${palette.border}` }}>
                  <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5" style={{ background: 'rgba(44,95,138,0.08)' }}>
                    <Stethoscope size={12} style={{ color: extra.info }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: 500 }}>
                        {rm.hewan.nama || rm.hewan.tag}<span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: extra.muted, marginLeft: 6 }}>#{rm.hewan.tag}</span>
                      </div>
                      <Badge variant="moss">
                        {kategoriMedisLabel[rm.kategori] || rm.kategori}
                      </Badge>
                    </div>
                    <div className="break-words mt-0.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: 'rgba(13,20,15,0.6)' }}>{rm.diagnosis}</div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: extra.muted, marginTop: 2 }}>{new Date(rm.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                  </div>
                </div>
              ))}
              {rekamMedisCount > 8 && (
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: extra.muted, textAlign: 'center', paddingTop: 4 }}>+ {rekamMedisCount - 8} rekam medis lainnya</div>
              )}
            </div>
          )}
        </KostaCard>

        <KostaCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <KostaSectionLabel style={{ fontSize: 9, letterSpacing: '0.2em', marginBottom: 4 }}>REPRODUKSI</KostaSectionLabel>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500 }}>Riwayat Perkawinan</div>
            </div>
            <Dna size={16} style={{ color: palette.ochre, opacity: 0.7 }} />
          </div>
          {reproduksiList.length === 0 ? (
            <EmptyState icon={Dna} title="Belum ada data reproduksi" />
          ) : (
            <div className="space-y-2.5">
              {reproduksiList.map((rp) => {
                const sc = rp.status === 'HAMIL' ? { bg: 'rgba(199,135,62,0.10)', color: palette.ochre } : rp.status === 'LAHIR' ? { bg: 'rgba(63,91,58,0.10)', color: palette.moss } : { bg: 'rgba(181,68,59,0.08)', color: extra.danger }
                return (
                  <div key={rp.id} className="flex items-start gap-3 py-2.5 px-3 rounded-xl" style={{ border: `1px solid ${palette.border}` }}>
                    <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5" style={{ background: sc.bg }}>
                      <Dna size={12} style={{ color: sc.color }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500 }}>
                          <span style={{ color: extra.danger }}>♀</span> {rp.induk.nama || rp.induk.tag}<span style={{ color: extra.muted, margin: '0 4px' }}>×</span><span style={{ color: extra.info }}>♂</span> {rp.pejantan.nama || rp.pejantan.tag}
                        </div>
                        <Badge
                          variant={rp.status === 'HAMIL' ? 'amber' : rp.status === 'LAHIR' ? 'emerald' : 'rose'}
                        >
                          {rp.status}
                        </Badge>
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: extra.muted, marginTop: 2 }}>
                        Kawin: {new Date(rp.tanggalKawin).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}{rp.status === 'HAMIL' && <> · Est. Lahir: {new Date(rp.estimasiLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</>}
                      </div>
                      {rp.inbreedingWarning && <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: extra.danger, marginTop: 2 }}>⚠ Peringatan inbreeding</div>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </KostaCard>
      </div>

      {/* Transfer + Tim */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <KostaCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <KostaSectionLabel style={{ fontSize: 9, letterSpacing: '0.2em', marginBottom: 4 }}>MOBILITAS</KostaSectionLabel>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500 }}>Riwayat Transfer Hewan</div>
            </div>
            <ArrowRightLeft size={16} style={{ color: palette.ochre, opacity: 0.7 }} />
          </div>
          {transferList.length === 0 ? (
            <EmptyState icon={ArrowRightLeft} title="Belum ada transfer" />
          ) : (
            <div className="space-y-2.5">
              {transferList.map((tr) => {
                const masuk = tr.toFarmId === id
                return (
                  <div key={tr.id} className="flex items-start gap-3 py-2.5 px-3 rounded-xl" style={{ border: `1px solid ${palette.border}` }}>
                    <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5" style={{ background: masuk ? 'rgba(63,91,58,0.10)' : 'rgba(199,135,62,0.10)' }}>
                      <ArrowRightLeft size={12} style={{ color: masuk ? palette.moss : palette.ochre }} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: 500 }}>
                          {tr.hewan.nama || tr.hewan.tag}<span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: extra.muted, marginLeft: 6 }}>#{tr.hewan.tag}</span>
                        </div>
                        <Badge variant={masuk ? 'emerald' : 'amber'}>
                          {masuk ? 'MASUK' : 'KELUAR'}
                        </Badge>
                      </div>
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: extra.muted, marginTop: 2 }}>{masuk ? `dari ${tr.fromFarm.nama}` : `ke ${tr.toFarm.nama}`}</div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: extra.muted, marginTop: 1 }}>{new Date(tr.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                    </div>
                  </div>
                )
              })}
              {transferCount > 8 && <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: extra.muted, textAlign: 'center', paddingTop: 4 }}>+ {transferCount - 8} transfer lainnya</div>}
            </div>
          )}
        </KostaCard>

        <KostaCard className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <KostaSectionLabel style={{ fontSize: 9, letterSpacing: '0.2em', marginBottom: 4 }}>TIM</KostaSectionLabel>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500 }}>Staf Terdaftar ({farm._count.members})</div>
            </div>
            <Users size={16} style={{ color: palette.ochre, opacity: 0.7 }} />
          </div>
          {farm.members.length === 0 ? (
            <EmptyState icon={Users} title="Belum ada staf" />
          ) : (
            <div className="space-y-2.5">
              {farm.members.map((uf) => {
                const u = uf.user
                const v = roleBadgeVariant[u.role]
                const avatarBg = v === 'ochre' ? 'rgba(199,135,62,0.12)' : v === 'moss' ? 'rgba(63,91,58,0.12)' : 'rgba(181,68,59,0.10)'
                return (
                  <div key={u.id} className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl" style={{ border: `1px solid ${palette.border}` }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: avatarBg, fontFamily: "'Fraunces',serif", fontSize: 12, fontWeight: 600, color: palette.ink }}>
                        {u.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="break-words" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: 500 }}>{u.name}</div>
                        <div className="break-all" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: extra.muted }}>{u.email}</div>
                      </div>
                    </div>
                    <Badge variant={roleBadgeVariant[u.role] ?? 'default'}>
                      {u.role === 'OWNER' ? 'Owner' : u.role === 'PETUGAS' ? 'Petugas' : u.role === 'SUPER_ADMIN' ? 'Admin' : u.role}
                    </Badge>
                  </div>
                )
              })}
            </div>
          )}
        </KostaCard>
      </div>

    </div>
  )
}
