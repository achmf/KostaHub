'use client'

import { motion, useInView, animate } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, Tooltip } from 'recharts'
import { TrendingUp, TrendingDown, AlertCircle, Calendar, Syringe } from 'lucide-react'
import { KostaPageHeader, KostaCard, Badge, KostaSectionLabel } from '@/components/KostaUI'

const palette = {
  cream: '#F2EDE0',
  creamSoft: '#FBF8EF',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  mossSoft: '#A5B5A0',
  ochre: '#C7873E',
  ochreSoft: '#E2B883',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  rose: '#B5443B',
  amber: '#D9A23C',
  emerald: '#3F7A4E',
}

const KATEGORI_LABEL: Record<string, string> = {
  INDUKAN: 'Indukan',
  PEJANTAN: 'Pejantan',
  ANAKAN: 'Anakan',
  DARA: 'Dara',
  JANTAN_MUDA: 'Jantan Muda',
}

function Count({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true })
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!inView) return
    const c = animate(0, to, {
      duration: 1.2,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (x) => setV(x),
    })
    return () => c.stop()
  }, [inView, to])
  return (
    <span ref={ref}>
      {Math.round(v).toLocaleString()}
      {suffix}
    </span>
  )
}

interface ReproItem {
  id: string
  induk: { nama: string | null; tag: string }
  estimasiLahir: string | Date
}

interface NotifItem {
  id: string
  title?: string
  message?: string
  tanggal: string | Date
}

interface KategoriStat {
  kategori: string
  _count: number
}

export default function DashboardClient({
  stats,
  reproduksiHamil,
  notifikasiVaksin,
  kategoriStats,
  isSuperAdmin,
  farmCount,
}: {
  stats: {
    totalHewan: number
    indukan: number
    pejantan: number
    sedangSakit: number
    mati: number
    terjual: number
  }
  reproduksiHamil: ReproItem[]
  notifikasiVaksin: NotifItem[]
  kategoriStats: KategoriStat[]
  isSuperAdmin: boolean
  farmCount: number
}) {
  const perawatan = stats.sedangSakit

  const pieData = kategoriStats.map((k) => ({
    name: KATEGORI_LABEL[k.kategori] ?? k.kategori,
    value: k._count,
  }))
  const pieColors = [palette.moss, palette.ink, palette.ochre, palette.mossSoft, palette.ochreSoft]

  return (
    <div>
      <KostaPageHeader
        title="Selamat datang kembali."
        description={
          isSuperAdmin
            ? `Data agregat dari ${farmCount} farm aktif.`
            : 'Kondisi farm Anda hari ini.'
        }
      />

      {/* Primary stat row — asymmetric */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Big card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="col-span-12 md:col-span-6 rounded-2xl p-7 relative overflow-hidden"
          style={{ background: palette.ink, color: palette.cream }}
        >
          <div className="flex items-start justify-between">
            <div>
              <KostaSectionLabel>
                <span style={{ color: 'rgba(242,237,224,0.55)' }}>TOTAL POPULASI</span>
              </KostaSectionLabel>
              <div
                className="mt-3"
                style={{
                  fontFamily: "'Fraunces',serif",
                  fontSize: 'clamp(3rem,7vw,5.5rem)',
                  lineHeight: 0.95,
                  letterSpacing: '-0.03em',
                }}
              >
                <Count to={stats.totalHewan} />
              </div>
              <div
                className="mt-3 flex items-center gap-2"
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
              >
                <span className="flex items-center gap-1" style={{ color: palette.ochreSoft }}>
                  <TrendingUp size={14} /> +12 minggu ini
                </span>
                <span className="opacity-50">·</span>
                <span className="opacity-70">ekor terdaftar aktif</span>
              </div>
            </div>
          </div>
          {/* Decorative goat silhouette */}
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute right-6 bottom-4 opacity-15"
          >
            <svg width="120" height="120" viewBox="0 0 64 64" fill="none">
              <path
                d="M14 30c0-3 2-5 5-5h2l-2-6c-.5-1.5 1-3 2.4-2.2L26 19l4-2 4 2 4.6-2.2C40 16 41.5 17.5 41 19l-2 6h2c3 0 5 2 5 5v6c0 6-4 11-10 13l-1 5h-4l-1-3h-4l-1 3h-4l-1-5c-6-2-10-7-10-13v-6z"
                stroke={palette.cream}
                strokeWidth="1.4"
              />
            </svg>
          </motion.div>
        </motion.div>

        {/* Small stat cards */}
        {[
          { l: 'Indukan Aktif', v: stats.indukan, t: 'betina dewasa', tone: palette.moss },
          { l: 'Pejantan', v: stats.pejantan, t: 'siap kawin', tone: palette.ink },
          { l: 'Dalam Perawatan', v: perawatan, t: 'perlu perhatian', tone: palette.ochre, warn: true },
        ].map((s, i) => (
          <motion.div
            key={s.l}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.07 }}
            className="col-span-12 md:col-span-2 rounded-2xl p-5"
            style={{ background: '#fff', border: `1px solid ${palette.border}` }}
          >
            <div className="flex items-center justify-between">
              <KostaSectionLabel>{s.l}</KostaSectionLabel>
              {s.warn && <AlertCircle size={14} style={{ color: palette.ochre }} />}
            </div>
            <div
              className="mt-3"
              style={{
                fontFamily: "'Fraunces',serif",
                fontSize: 40,
                lineHeight: 1,
                letterSpacing: '-0.025em',
                color: s.tone,
              }}
            >
              <Count to={s.v} />
            </div>
            <div
              className="mt-2"
              style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.55)' }}
            >
              {s.t}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Secondary stat strip */}
      <KostaCard className="p-5 mb-8 grid grid-cols-2 md:grid-cols-4 gap-6">
        {[
          {
            l: 'Angka kematian',
            v: stats.mati,
            hint: `${(((stats.mati) / Math.max(stats.totalHewan + stats.mati + stats.terjual, 1)) * 100).toFixed(1)}% dari total`,
            icon: <TrendingDown size={14} style={{ color: palette.rose }} />,
          },
          {
            l: 'Total terjual',
            v: stats.terjual,
            hint: 'cycle Mei 2026',
            icon: <TrendingUp size={14} style={{ color: palette.emerald }} />,
          },
          {
            l: 'Estimasi lahir 7 hari',
            v: reproduksiHamil.length,
            hint: 'berdasarkan +150 hari',
            icon: <Calendar size={14} style={{ color: palette.moss }} />,
          },
          {
            l: 'Vaksin terjadwal',
            v: notifikasiVaksin.length,
            hint: 'minggu ini',
            icon: <Syringe size={14} style={{ color: palette.ochre }} />,
          },
        ].map((s) => (
          <div key={s.l} className="flex flex-col">
            <div className="flex items-center gap-2">
              {s.icon}
              <KostaSectionLabel>{s.l}</KostaSectionLabel>
            </div>
            <div
              className="mt-1"
              style={{ fontFamily: "'Fraunces',serif", fontSize: 28, letterSpacing: '-0.02em' }}
            >
              <Count to={s.v} />
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: 'rgba(13,20,15,0.55)' }}>
              {s.hint}
            </div>
          </div>
        ))}
      </KostaCard>

      {/* Charts row */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Pie chart */}
        <KostaCard className="col-span-12 lg:col-span-5 p-6">
          <div className="flex items-center justify-between mb-2">
            <KostaSectionLabel>DISTRIBUSI KATEGORI</KostaSectionLabel>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.5 }}>
              {stats.totalHewan} EKOR
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="w-44 h-44 relative">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={2}
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <div
                  style={{ fontFamily: "'Fraunces',serif", fontSize: 30, lineHeight: 1, letterSpacing: '-0.02em' }}
                >
                  {stats.totalHewan}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', opacity: 0.6 }}>
                  AKTIF
                </div>
              </div>
            </div>
            <div className="flex-1 grid gap-2">
              {pieData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: pieColors[i] }} />
                  <span className="flex-1" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>
                    {p.name}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, opacity: 0.65 }}>
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </KostaCard>

        {/* Farm bar — only for super admin */}
        {isSuperAdmin && (
          <KostaCard className="col-span-12 lg:col-span-7 p-6">
            <div className="flex items-center justify-between mb-4">
              <KostaSectionLabel>POPULASI PER FARM</KostaSectionLabel>
              <Badge variant="moss">{farmCount} LOKASI</Badge>
            </div>
            <div className="h-52">
              <ResponsiveContainer>
                <BarChart data={[{ name: 'Farm Anda', v: stats.totalHewan }]}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: palette.ink, opacity: 0.6 }}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(13,20,15,0.04)' }}
                    contentStyle={{
                      background: palette.ink,
                      color: palette.cream,
                      border: 'none',
                      borderRadius: 8,
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 12,
                    }}
                    labelStyle={{ color: palette.cream }}
                  />
                  <Bar dataKey="v" fill={palette.moss} radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </KostaCard>
        )}

        {/* Notifikasi card — shown when not super admin */}
        {!isSuperAdmin && (
          <KostaCard className="col-span-12 lg:col-span-7 p-6">
            <div className="flex items-center justify-between mb-4">
              <KostaSectionLabel>VAKSIN AKTIF</KostaSectionLabel>
              <Badge variant="ochre">{notifikasiVaksin.length} BARU</Badge>
            </div>
            <div className="space-y-2.5">
              {notifikasiVaksin.length === 0 && (
                <div className="py-8 text-center opacity-60" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  Tidak ada notifikasi vaksin.
                </div>
              )}
              {notifikasiVaksin.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex gap-3 p-3 rounded-lg"
                  style={{
                    background: 'rgba(199,135,62,0.08)',
                    border: '1px solid rgba(199,135,62,0.18)',
                  }}
                >
                  <Syringe size={14} style={{ color: palette.ochre, marginTop: 3 }} />
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                      {n.title ?? n.message ?? 'Notifikasi vaksin'}
                    </div>
                    <div
                      className="opacity-60 mt-0.5"
                      style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}
                    >
                      {new Date(n.tanggal).toLocaleDateString('id-ID')}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </KostaCard>
        )}
      </div>

      {/* Bottom lists */}
      <div className="grid grid-cols-12 gap-4">
        {/* Estimasi kelahiran */}
        <KostaCard className="col-span-12 lg:col-span-7 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <KostaSectionLabel>ESTIMASI KELAHIRAN</KostaSectionLabel>
              <div
                className="mt-1"
                style={{ fontFamily: "'Fraunces',serif", fontSize: 22, letterSpacing: '-0.02em' }}
              >
                5 terdekat
              </div>
            </div>
            <Badge variant="amber">HAMIL</Badge>
          </div>
          <div className="divide-y" style={{ borderColor: palette.border }}>
            {reproduksiHamil.length === 0 && (
              <div className="py-6 text-center opacity-60" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                Belum ada kehamilan tercatat.
              </div>
            )}
            {reproduksiHamil.slice(0, 5).map((r, i) => {
              const days = Math.ceil(
                (new Date(r.estimasiLahir).getTime() - Date.now()) / 86400000
              )
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="py-3 flex items-center gap-4"
                  style={{ borderColor: palette.border }}
                >
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{
                      background: 'rgba(63,91,58,0.12)',
                      color: palette.moss,
                      fontFamily: "'Fraunces',serif",
                      fontSize: 14,
                    }}
                  >
                    {(r.induk.nama || r.induk.tag || '?').slice(0, 1)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
                      {r.induk.nama || 'Tanpa Nama'}
                    </div>
                    <div
                      className="opacity-60"
                      style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}
                    >
                      {r.induk.tag}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      style={{ fontFamily: "'Fraunces',serif", fontSize: 18, letterSpacing: '-0.02em' }}
                    >
                      {days > 0 ? `${days}` : '—'}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.55 }}>
                      HARI LAGI
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </KostaCard>

        {/* Vaksin notifikasi */}
        <KostaCard className="col-span-12 lg:col-span-5 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <KostaSectionLabel>VAKSIN AKTIF</KostaSectionLabel>
              <div
                className="mt-1"
                style={{ fontFamily: "'Fraunces',serif", fontSize: 22, letterSpacing: '-0.02em' }}
              >
                Notifikasi
              </div>
            </div>
            <Badge variant="ochre">{notifikasiVaksin.length} BARU</Badge>
          </div>
          <div className="space-y-2.5">
            {notifikasiVaksin.length === 0 && (
              <div className="py-8 text-center opacity-60" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                Tidak ada notifikasi.
              </div>
            )}
            {notifikasiVaksin.slice(0, 5).map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex gap-3 p-3 rounded-lg"
                style={{
                  background: 'rgba(199,135,62,0.08)',
                  border: '1px solid rgba(199,135,62,0.18)',
                }}
              >
                <Syringe size={14} style={{ color: palette.ochre, marginTop: 3 }} />
                <div className="flex-1 min-w-0">
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                    {n.title ?? n.message ?? 'Notifikasi vaksin'}
                  </div>
                  <div
                    className="opacity-60 mt-0.5"
                    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}
                  >
                    {new Date(n.tanggal).toLocaleDateString('id-ID')}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </KostaCard>
      </div>
    </div>
  )
}
