'use client'

import { motion, useInView, animate } from 'framer-motion'
import { useEffect, useRef, useState, useMemo } from 'react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar,
  XAxis, YAxis, Tooltip, AreaChart, Area, LineChart, Line,
} from 'recharts'
import {
  TrendingUp, TrendingDown, AlertCircle, Calendar, Syringe,
  Scale,
} from 'lucide-react'
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

const pieColors = [palette.moss, palette.ink, palette.ochre, palette.mossSoft, palette.ochreSoft]
const chartGreen = '#3F7A4E'
const chartRed = '#B5443B'
const chartAmber = '#D9A23C'

const KATEGORI_LABEL: Record<string, string> = {
  INDUKAN: 'Indukan',
  PEJANTAN: 'Pejantan',
  ANAKAN: 'Anakan',
  DARA: 'Dara',
  JANTAN_MUDA: 'Jantan Muda',
}

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

// ─── PRESET OPTIONS ────────────────────────────────────────
const PRESETS = [
  { label: '1 Bln', months: 1 },
  { label: '3 Bln', months: 3 },
  { label: '6 Bln', months: 6 },
  { label: '1 Thn', months: 12 },
] as const

function getFromDate(months: number): Date {
  const d = new Date()
  d.setMonth(d.getMonth() - months)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── PER-CARD FILTER PILLS ─────────────────────────────────
function ChartFilter({
  value,
  onChange,
}: {
  value: number
  onChange: (months: number) => void
}) {
  return (
    <div className="flex items-center gap-1">
      {PRESETS.map((p) => {
        const active = value === p.months
        return (
          <button
            key={p.months}
            onClick={() => onChange(p.months)}
            className="cursor-pointer px-2.5 py-1 rounded-full transition-all"
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9.5,
              letterSpacing: '0.08em',
              border: `1px solid ${active ? palette.ink : palette.border}`,
              background: active ? palette.ink : 'transparent',
              color: active ? palette.cream : 'rgba(13,20,15,0.5)',
            }}
          >
            {p.label}
          </button>
        )
      })}
    </div>
  )
}

// ─── CLIENT-SIDE AGGREGATION HELPERS ──────────────────────
function buildTrendData(
  raw: { createdAt: string; status: string }[],
  months: number
) {
  const from = getFromDate(months)
  const to = new Date()

  const map = new Map<string, { masuk: number; mati: number; terjual: number }>()
  const cur = new Date(from.getFullYear(), from.getMonth(), 1)
  const end = new Date(to.getFullYear(), to.getMonth(), 1)
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '00')}`
    map.set(key, { masuk: 0, mati: 0, terjual: 0 })
    cur.setMonth(cur.getMonth() + 1)
  }

  raw.forEach((h) => {
    const d = new Date(h.createdAt)
    if (d >= from && d <= to) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '00')}`
      const entry = map.get(key)
      if (entry) {
        entry.masuk++
        if (h.status === 'MATI') entry.mati++
        if (h.status === 'TERJUAL') entry.terjual++
      }
    }
  })

  return Array.from(map.entries()).map(([key, val]) => {
    const [yr, mo] = key.split('-')
    const label =
      map.size > 12
        ? `${monthNames[parseInt(mo) - 1]} '${yr.slice(2)}`
        : monthNames[parseInt(mo) - 1]
    return { label, ...val }
  })
}

function buildBeratData(
  raw: { tanggal: string; berat: number }[],
  months: number
) {
  const from = getFromDate(months)
  const to = new Date()

  const map = new Map<string, { masuk: number; mati: number; terjual: number }>()
  const cur = new Date(from.getFullYear(), from.getMonth(), 1)
  const end = new Date(to.getFullYear(), to.getMonth(), 1)
  while (cur <= end) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '00')}`
    map.set(key, { masuk: 0, mati: 0, terjual: 0 })
    cur.setMonth(cur.getMonth() + 1)
  }

  const beratMap = new Map<string, { total: number; count: number }>()
  raw.forEach((b) => {
    const d = new Date(b.tanggal)
    if (d >= from && d <= to) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '00')}`
      const entry = beratMap.get(key) || { total: 0, count: 0 }
      entry.total += b.berat
      entry.count++
      beratMap.set(key, entry)
    }
  })

  return Array.from(map.keys()).map((key) => {
    const [yr, mo] = key.split('-')
    const label =
      map.size > 12
        ? `${monthNames[parseInt(mo) - 1]} '${yr.slice(2)}`
        : monthNames[parseInt(mo) - 1]
    const entry = beratMap.get(key)
    return {
      label,
      avgBerat: entry ? Math.round((entry.total / entry.count) * 10) / 10 : null,
    }
  })
}

function buildTopDiagnosis(
  raw: { diagnosis: string; tanggal: string }[],
  months: number
) {
  const from = getFromDate(months)
  const to = new Date()

  const count = new Map<string, number>()
  raw.forEach((m) => {
    const d = new Date(m.tanggal)
    if (d >= from && d <= to) {
      const name = m.diagnosis.trim()
      if (name) count.set(name, (count.get(name) || 0) + 1)
    }
  })

  return Array.from(count.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, c]) => ({ name, count: c }))
}

// ─── UTILITIES ─────────────────────────────────────────────
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

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="h-full flex items-center justify-center">
      <span
        style={{
          fontFamily: "'Inter',sans-serif",
          fontSize: 13,
          fontStyle: 'italic',
          opacity: 0.4,
        }}
      >
        {message}
      </span>
    </div>
  )
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 10.5, opacity: 0.6 }}>
        {label}
      </span>
    </div>
  )
}

// ─── INTERFACES ────────────────────────────────────────────
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

interface OverviewData {
  mortalityRate: number
  birthSuccessRate: number
  totalLahir: number
  totalGagal: number
  totalHamil: number
  avgBerat: number
  kategoriData: { name: string; value: number }[]
  distribusiUmur: { name: string; value: number }[]
}

// ─── MAIN COMPONENT ────────────────────────────────────────
export default function DashboardClient({
  stats,
  reproduksiHamil,
  notifikasiVaksin,
  kategoriStats,
  isSuperAdmin,
  farmCount,
  overviewData,
  trendRaw,
  beratRaw,
  diagnosisRaw,
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
  overviewData: OverviewData
  trendRaw: { createdAt: string; status: string }[]
  beratRaw: { tanggal: string; berat: number }[]
  diagnosisRaw: { diagnosis: string; tanggal: string }[]
}) {
  const perawatan = stats.sedangSakit

  const pieData = kategoriStats.map((k) => ({
    name: KATEGORI_LABEL[k.kategori] ?? k.kategori,
    value: k._count,
  }))

  // ─── Per-card filter state (default 6 bulan) ───────────
  const [trendMonths, setTrendMonths] = useState(6)
  const [beratMonths, setBeratMonths] = useState(6)
  const [diagnosisMonths, setDiagnosisMonths] = useState(6)

  // ─── Computed chart data (client-side filtering) ────────
  const trendData = useMemo(
    () => buildTrendData(trendRaw, trendMonths),
    [trendRaw, trendMonths]
  )
  const beratTrendData = useMemo(
    () => buildBeratData(beratRaw, beratMonths),
    [beratRaw, beratMonths]
  )
  const topDiagnosa = useMemo(
    () => buildTopDiagnosis(diagnosisRaw, diagnosisMonths),
    [diagnosisRaw, diagnosisMonths]
  )

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

      {/* ─── PRIMARY STAT ROW ────────────────────────────── */}
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
                  <TrendingUp size={14} /> ekor terdaftar aktif
                </span>
                <span className="opacity-50">·</span>
                <span className="opacity-70">{overviewData.mortalityRate}% mortality rate</span>
              </div>
            </div>
          </div>
          {/* Decorative goat */}
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

      {/* ─── SECONDARY STAT STRIP ────────────────────────── */}
      <KostaCard className="p-5 mb-4 grid grid-cols-2 md:grid-cols-5 gap-6">
        {[
          {
            l: 'Angka kematian',
            v: stats.mati,
            hint: `${overviewData.mortalityRate}% dari total`,
            icon: <TrendingDown size={14} style={{ color: palette.rose }} />,
          },
          {
            l: 'Total terjual',
            v: stats.terjual,
            hint: 'sepanjang waktu',
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
          {
            l: 'Rata-rata Berat',
            v: overviewData.avgBerat,
            hint: 'kg populasi aktif',
            icon: <Scale size={14} style={{ color: palette.moss }} />,
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
            <div
              style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: 'rgba(13,20,15,0.55)' }}
            >
              {s.hint}
            </div>
          </div>
        ))}
      </KostaCard>

      {/* ─── TREN POPULASI + DISTRIBUSI KATEGORI ─────────── */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Tren Populasi — filter di dalam kartu */}
        <KostaCard className="col-span-12 lg:col-span-8 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <KostaSectionLabel>TREN POPULASI</KostaSectionLabel>
            </div>
            <div className="flex items-center gap-3">
              <ChartFilter value={trendMonths} onChange={setTrendMonths} />
              <div className="flex gap-3 ml-1">
                <LegendDot color={chartGreen} label="Masuk" />
                <LegendDot color={chartRed} label="Mati" />
                <LegendDot color={chartAmber} label="Terjual" />
              </div>
            </div>
          </div>
          <div className="h-56">
            {trendData.some((t) => t.masuk > 0 || t.mati > 0 || t.terjual > 0) ? (
              <ResponsiveContainer>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="gradMasuk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={chartGreen} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={chartGreen} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      fill: palette.ink,
                      opacity: 0.6,
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      fill: palette.ink,
                      opacity: 0.4,
                    }}
                    width={30}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    contentStyle={{
                      backgroundColor: '#0D140F',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 12,
                      opacity: 1,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="masuk"
                    stroke={chartGreen}
                    fill="url(#gradMasuk)"
                    strokeWidth={2}
                    name="Masuk"
                  />
                  <Area
                    type="monotone"
                    dataKey="mati"
                    stroke={chartRed}
                    fill="transparent"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    name="Mati"
                  />
                  <Area
                    type="monotone"
                    dataKey="terjual"
                    stroke={chartAmber}
                    fill="transparent"
                    strokeWidth={1.5}
                    strokeDasharray="4 3"
                    name="Terjual"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Belum ada data tren dalam rentang ini" />
            )}
          </div>
        </KostaCard>

        {/* Distribusi Kategori (tidak time-filtered) */}
        <KostaCard className="col-span-12 lg:col-span-4 p-6">
          <div className="flex items-center justify-between mb-2">
            <KostaSectionLabel>DISTRIBUSI KATEGORI</KostaSectionLabel>
            <span
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.5 }}
            >
              {stats.totalHewan} EKOR
            </span>
          </div>
          <div className="flex flex-col items-center mt-2">
            <div className="w-40 h-40 relative">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={48}
                    outerRadius={72}
                    paddingAngle={2}
                    stroke="none"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={pieColors[i % pieColors.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    contentStyle={{
                      backgroundColor: '#0D140F',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 12,
                      opacity: 1,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <div
                  style={{
                    fontFamily: "'Fraunces',serif",
                    fontSize: 30,
                    lineHeight: 1,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stats.totalHewan}
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    letterSpacing: '0.15em',
                    opacity: 0.6,
                  }}
                >
                  AKTIF
                </div>
              </div>
            </div>
            <div className="w-full grid gap-1.5 mt-3">
              {pieData.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: pieColors[i % pieColors.length] }}
                  />
                  <span className="flex-1" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
                    {p.name}
                  </span>
                  <span
                    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, opacity: 0.65 }}
                  >
                    {p.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </KostaCard>
      </div>

      {/* ─── REPRODUKSI + TOP DIAGNOSA + DISTRIBUSI UMUR ──── */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        {/* Reproduksi Overview (tidak time-filtered) */}
        <KostaCard
          className="col-span-12 lg:col-span-4 p-6"
          style={{ background: palette.ink, color: palette.cream, border: 'none' }}
        >
          <KostaSectionLabel>
            <span style={{ color: 'rgba(242,237,224,0.55)' }}>REPRODUKSI OVERVIEW</span>
          </KostaSectionLabel>
          <div className="flex items-center gap-6 mt-4">
            <div className="relative w-28 h-28 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(242,237,224,0.12)" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke={overviewData.birthSuccessRate >= 70 ? chartGreen : chartAmber}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(overviewData.birthSuccessRate / 100) * 264} 264`}
                  transform="rotate(-90 50 50)"
                  style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  style={{
                    fontFamily: "'Fraunces',serif",
                    fontSize: 24,
                    letterSpacing: '-0.02em',
                  }}
                >
                  {overviewData.birthSuccessRate}%
                </span>
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 9, opacity: 0.6 }}>
                  Success
                </span>
              </div>
            </div>
            <div className="grid gap-3">
              {[
                { label: 'Hamil aktif', value: overviewData.totalHamil, color: chartAmber },
                { label: 'Berhasil lahir', value: overviewData.totalLahir, color: chartGreen },
                { label: 'Gagal', value: overviewData.totalGagal, color: chartRed },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.color }} />
                  <span
                    style={{
                      fontFamily: "'Fraunces',serif",
                      fontSize: 18,
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {s.value}
                  </span>
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, opacity: 0.6 }}>
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </KostaCard>

        {/* Top Diagnosa — filter di dalam kartu */}
        <KostaCard className="col-span-12 lg:col-span-4 p-6">
          <div className="flex items-center justify-between mb-4">
            <KostaSectionLabel>TOP DIAGNOSA MEDIS</KostaSectionLabel>
            <ChartFilter value={diagnosisMonths} onChange={setDiagnosisMonths} />
          </div>
          {topDiagnosa.length > 0 ? (
            <div className="grid gap-2">
              {topDiagnosa.map((d, i) => {
                const maxCount = topDiagnosa[0].count
                const pct = maxCount > 0 ? (d.count / maxCount) * 100 : 0
                return (
                  <div key={d.name}>
                    <div className="flex items-center justify-between mb-1">
                      <span
                        style={{
                          fontFamily: "'Inter',sans-serif",
                          fontSize: 12.5,
                          color: palette.ink,
                        }}
                      >
                        {d.name}
                      </span>
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 11,
                          opacity: 0.6,
                        }}
                      >
                        {d.count}
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full"
                      style={{ background: 'rgba(13,20,15,0.06)' }}
                    >
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: i === 0 ? palette.ochre : palette.mossSoft }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5, delay: i * 0.08 }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyChart message="Tidak ada diagnosa dalam rentang ini" />
          )}
        </KostaCard>

        {/* Distribusi Umur (tidak time-filtered) */}
        <KostaCard className="col-span-12 lg:col-span-4 p-6">
          <KostaSectionLabel>DISTRIBUSI UMUR POPULASI</KostaSectionLabel>
          {overviewData.distribusiUmur.length > 0 ? (
            <div className="h-52 mt-3">
              <ResponsiveContainer>
                <BarChart
                  data={overviewData.distribusiUmur}
                  layout="vertical"
                  margin={{ left: 10 }}
                >
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    width={55}
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      fill: palette.ink,
                      opacity: 0.6,
                    }}
                  />
                  <XAxis type="number" hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    contentStyle={{
                      backgroundColor: '#0D140F',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 12,
                      opacity: 1,
                    }}
                    formatter={(v: unknown) => [`${v as number} ekor`, 'Jumlah']}
                  />
                  <Bar
                    dataKey="value"
                    fill={palette.moss}
                    radius={[0, 6, 6, 0]}
                    name="Jumlah"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Belum ada data umur" />
          )}
        </KostaCard>
      </div>

      {/* ─── TREN BERAT BADAN — filter di dalam kartu ─────── */}
      {beratRaw.length > 0 && (
        <KostaCard className="p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <KostaSectionLabel>TREN RATA-RATA BERAT BADAN</KostaSectionLabel>
              <Badge variant="ochre">AVG {overviewData.avgBerat} kg</Badge>
            </div>
            <ChartFilter value={beratMonths} onChange={setBeratMonths} />
          </div>
          <div className="h-48">
            {beratTrendData.some((b) => b.avgBerat !== null) ? (
              <ResponsiveContainer>
                <LineChart data={beratTrendData.filter((b) => b.avgBerat !== null)}>
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      fill: palette.ink,
                      opacity: 0.6,
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
                      fill: palette.ink,
                      opacity: 0.4,
                    }}
                    width={40}
                    unit=" kg"
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    itemStyle={{ color: '#ffffff' }}
                    labelStyle={{ color: '#ffffff' }}
                    contentStyle={{
                      backgroundColor: '#0D140F',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 8,
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 12,
                      opacity: 1,
                    }}
                    formatter={(v) => [`${v as number} kg`, 'Rata-rata Berat']}
                  />
                  <Line
                    type="monotone"
                    dataKey="avgBerat"
                    stroke={palette.ochre}
                    strokeWidth={2.5}
                    dot={{ fill: palette.ochre, r: 4, strokeWidth: 0 }}
                    name="Rata-rata Berat"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <EmptyChart message="Belum ada data berat dalam rentang ini" />
            )}
          </div>
        </KostaCard>
      )}

      {/* ─── BOTTOM LISTS ────────────────────────────────── */}
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
              <div
                className="py-6 text-center opacity-60"
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
              >
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
                      style={{
                        fontFamily: "'Fraunces',serif",
                        fontSize: 18,
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {days > 0 ? `${days}` : '—'}
                    </div>
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        opacity: 0.55,
                      }}
                    >
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
              <div
                className="py-8 text-center opacity-60"
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
              >
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
