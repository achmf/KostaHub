'use client'

import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import {
  Building2,
  Users,
  Activity,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Heart,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  Dna,
  Minus,
  Flame,
  Timer,
  HeartCrack,
} from 'lucide-react'
import Link from 'next/link'
import PaginationControl from './PaginationControl'
import { usePagination } from '@/hooks/usePagination'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ochre: '#C7873E',
  ochreSoft: '#E2B883',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.09)',
  moss: '#3F5B3A',
  danger: '#B5443B',
  info: '#2C5F8A',
}

const CHART_COLORS = ['#C7873E', '#3F5B3A', '#2C5F8A', '#7A5C2E', '#B5443B', '#1B5E7A']

interface TrendStat {
  curr: number
  delta: number
}

interface Stats {
  totalFarm: number
  farmAktif: number
  totalUser: number
  totalHewan: number
  mortalityRate: number
  pendingApprovals: number
  totalOwner: number
  birthSuccessRate: number
  totalHamil: number
}

interface FarmComparison {
  id: string
  nama: string
  namaPanjang: string
  hewan: number
  user: number
  status: string
  healthScore?: number
  mortalityRateFarm?: number
}

interface AdminDashboardClientProps {
  stats: Stats
  trend: {
    farm: TrendStat
    user: TrendStat
    hewanMasuk: TrendStat
    hewanMati: TrendStat
  }
  trendData: { label: string; masuk: number; keluar: number }[]
  farmComparison: FarmComparison[]
  kategoriData: { name: string; value: number }[]
  topDiagnosa: { name: string; count: number }[]
  farmAlerts: { id: string; nama: string; reason: string }[]
  inactiveFarms: { id: string; nama: string; reason: string }[]
  highMortalityFarms: { id: string; nama: string; mortalityRate: number }[]
  recentPending: { id: string; name: string; email: string; createdAt: string }[]
}

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.07, duration: 0.5, ease: 'easeOut' as const },
  }),
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 4 }}
    >
      {children}
    </div>
  )
}

const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div
    className={`p-4 sm:p-5 sm:px-6 rounded-2xl h-full flex flex-col min-w-0 ${className}`}
    style={{ background: '#fff', border: `1px solid ${palette.border}` }}
  >
    {children}
  </div>
)

// Unified tooltip style
const tooltipStyle = {
  contentStyle: { backgroundColor: palette.ink, color: '#fff', fontFamily: "'Inter',sans-serif", fontSize: 12, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' },
  itemStyle: { color: '#ffffff' },
  labelStyle: { color: 'rgba(255,255,255,0.6)', fontFamily: "'Inter',sans-serif", fontSize: 12, marginBottom: 4 },
  cursor: { fill: 'rgba(13,20,15,0.03)' },
}

// ChartLegend — unified legend outside scroll areas
function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>
      {items.map((item) => (
        <span key={item.label} className="flex items-center gap-1.5" style={{ color: item.color }}>
          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: item.color }} />
          {item.label}
        </span>
      ))}
    </div>
  )
}

// TrendBadge — shows delta % vs last month
function TrendBadge({ delta, invertedDanger = false }: { delta: number; invertedDanger?: boolean }) {
  // invertedDanger=true means UP is BAD (e.g. mortality)
  const isGood = invertedDanger ? delta <= 0 : delta >= 0
  const color = isGood ? palette.moss : palette.danger
  const bg = isGood ? 'rgba(63,91,58,0.12)' : 'rgba(181,68,59,0.12)'
  const Icon = delta > 0 ? TrendingUp : delta < 0 ? TrendingDown : Minus

  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
      style={{ background: bg, color, fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.05em' }}
    >
      <Icon size={9} />
      {delta > 0 ? '+' : ''}{delta}%
    </span>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const rawData = payload[0]?.payload;
    const isFarmComparison = rawData && rawData.hewan !== undefined && rawData.user !== undefined;
    const ratio = isFarmComparison && rawData.user > 0 ? Math.round(rawData.hewan / rawData.user) : 0;

    return (
      <div style={{ backgroundColor: palette.ink, color: '#fff', padding: '12px 16px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
          {rawData?.namaPanjang || label}
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
            <div className="flex items-center gap-2">
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: entry.color }} />
              <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>{entry.name}</span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, fontWeight: 500 }}>
              {entry.value}
            </span>
          </div>
        ))}
        {isFarmComparison && (
          <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.1)', fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>
            <span style={{ color: palette.ochreSoft, fontWeight: 500 }}>Beban:</span> {ratio > 0 ? `${ratio} ekor / staf` : 'Tidak ada staf aktif'}
          </div>
        )}
      </div>
    )
  }
  return null
}


export default function AdminDashboardClient({
  stats,
  trend,
  trendData,
  farmComparison,
  kategoriData,
  topDiagnosa,
  farmAlerts,
  inactiveFarms = [],
  highMortalityFarms = [],
  recentPending,
}: AdminDashboardClientProps) {
  const inactiveP = usePagination(inactiveFarms, 6)
  const kpiCards = [
    {
      label: 'Total Farm',
      value: stats.totalFarm,
      sub: `${stats.farmAktif} aktif`,
      icon: Building2,
      color: palette.ochre,
      bg: 'rgba(199,135,62,0.10)',
      href: '/admin/farms',
      trendKey: 'farm' as const,
      invertedDanger: false,
    },
    {
      label: 'Total Hewan',
      value: stats.totalHewan.toLocaleString(),
      sub: 'seluruh wilayah',
      icon: Activity,
      color: palette.moss,
      bg: 'rgba(63,91,58,0.10)',
      href: '#analytics',
      trendKey: 'hewanMasuk' as const,
      invertedDanger: false,
    },
    {
      label: 'Total User',
      value: stats.totalUser,
      sub: `${stats.totalOwner} owner`,
      icon: Users,
      color: palette.info,
      bg: 'rgba(44,95,138,0.10)',
      href: '/admin/users',
      trendKey: 'user' as const,
      invertedDanger: false,
    },
    {
      label: 'Mortality Rate',
      value: `${stats.mortalityRate}%`,
      sub: 'tingkat kematian',
      icon: HeartCrack,
      color: stats.mortalityRate > 10 ? palette.danger : palette.moss,
      bg: stats.mortalityRate > 10 ? 'rgba(181,68,59,0.08)' : 'rgba(63,91,58,0.10)',
      href: '#analytics',
      trendKey: 'hewanMati' as const,
      invertedDanger: true,
    },
    {
      label: 'Keberhasilan Reproduksi',
      value: `${stats.birthSuccessRate}%`,
      sub: `${stats.totalHamil} sedang hamil`,
      icon: Dna,
      color: palette.ochre,
      bg: 'rgba(199,135,62,0.08)',
      href: '#analytics',
      trendKey: null,
      invertedDanger: false,
    },
    {
      label: 'Permohonan Pending',
      value: stats.pendingApprovals,
      sub: 'menunggu persetujuan',
      icon: Clock,
      color: stats.pendingApprovals > 0 ? palette.danger : palette.moss,
      bg: stats.pendingApprovals > 0 ? 'rgba(181,68,59,0.08)' : 'rgba(63,91,58,0.10)',
      href: '/admin/approvals',
      trendKey: null,
      invertedDanger: false,
    },
  ]

  return (
    <div>
      {/* ── PAGE HEADER ── */}
      <motion.div
        className="mb-6 sm:mb-10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 8 }}>
          KOSTAHUB — MONITORING REGIONAL
        </div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 400, letterSpacing: '-0.025em', lineHeight: 1.1 }}>
          Dashboard <span style={{ fontStyle: 'italic', color: palette.ochre }}>Administrasi</span>
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.55)', marginTop: 6 }}>
          Ringkasan status seluruh peternakan di wilayah Anda.
        </p>
      </motion.div>

      {/* ── KPI CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-6 sm:mb-10">
        {kpiCards.map((card, i) => {
          const Icon = card.icon
          const trendData2 = card.trendKey ? trend[card.trendKey] : null
          return (
            <motion.div key={card.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
              <Link href={card.href} className="block group h-full">
                <div
                  className="rounded-2xl p-4 sm:p-5 h-full transition-all group-hover:shadow-md group-hover:-translate-y-0.5"
                  style={{ background: '#fff', border: `1px solid ${palette.border}` }}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: card.bg }}>
                      <Icon size={17} style={{ color: card.color }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {trendData2 && (
                        <TrendBadge delta={trendData2.delta} invertedDanger={card.invertedDanger} />
                      )}
                      <ArrowUpRight size={14} style={{ color: 'rgba(13,20,15,0.25)', transition: 'color 0.2s' }} className="group-hover:text-ochre mt-1" />
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(22px, 6vw, 28px)', fontWeight: 400, color: palette.ink, lineHeight: 1 }}>
                    {card.value}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.5)', marginTop: 6 }}>
                    {card.label.toUpperCase()}
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-2 mt-2">
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.45)' }}>
                      {card.sub}
                    </div>
                    {trendData2 && (
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.35)' }}>
                        +{trendData2.curr} bln ini
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>

      {/* ── ROW 2: TREND + ALERTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Trend Populasi */}
        <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="xl:col-span-2">
          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div>
                <SectionLabel>TREN POPULASI REGIONAL</SectionLabel>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink }}>
                  Pergerakan hewan 6 bulan terakhir
                </div>
              </div>
              <TrendingUp size={16} style={{ color: palette.ochre, opacity: 0.7 }} />
            </div>
            <div className="w-full min-w-0">
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={trendData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminGradMasuk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.moss} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={palette.moss} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="adminGradKeluar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={palette.ochre} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={palette.ochre} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,20,15,0.05)" horizontal={false} vertical={true} />
                  <XAxis dataKey="label" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.45)' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.45)' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ stroke: 'rgba(13,20,15,0.1)', strokeWidth: 1, strokeDasharray: '3 3' }}
                  />
                  <Area type="monotone" dataKey="masuk" name="Masuk" stroke={palette.moss} strokeWidth={2.5} fill="url(#adminGradMasuk)" activeDot={{ r: 5, strokeWidth: 0, fill: palette.moss }} />
                  <Area type="monotone" dataKey="keluar" name="Keluar" stroke={palette.ochre} strokeWidth={2.5} fill="url(#adminGradKeluar)" activeDot={{ r: 5, strokeWidth: 0, fill: palette.ochre }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <ChartLegend
              items={[
                { label: 'Masuk', color: palette.moss },
                { label: 'Keluar', color: palette.ochre },
              ]}
            />
          </Card>
        </motion.div>

        {/* Alerts & Pending */}
        <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col gap-4">
          {/* High Mortality Alert */}
          {highMortalityFarms.length > 0 && (
            <Card>
              <SectionLabel>ALERT KEMATIAN TINGGI</SectionLabel>
              <div className="space-y-2">
                {highMortalityFarms.map((f) => (
                  <Link
                    key={f.id}
                    href={`/admin/farms/${f.id}`}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg hover:bg-black/3 transition-colors"
                    style={{ border: '1px solid rgba(181,68,59,0.2)', background: 'rgba(181,68,59,0.05)' }}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Flame size={11} style={{ color: palette.danger, flexShrink: 0 }} />
                      <span className="min-w-0 break-words" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, color: palette.ink }}>{f.nama}</span>
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: palette.danger, fontWeight: 600 }}>
                      {f.mortalityRate}%
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          {/* Farm Alerts */}
          <Card className="flex-1">
            <SectionLabel>PERINGATAN FARM</SectionLabel>
            {farmAlerts.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center">
                <div 
                  className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-xl text-center sm:text-left"
                  style={{ border: '1px solid rgba(63,91,58,0.15)', background: 'rgba(63,91,58,0.04)' }}
                >
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(63,91,58,0.1)' }}
                  >
                    <CheckCircle2 size={24} style={{ color: palette.moss }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, color: palette.ink, marginBottom: 2 }}>
                      Status Regional Normal
                    </div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.6)', lineHeight: 1.4 }}>
                      Tidak ada farm yang memerlukan perhatian khusus saat ini. Semua parameter terpantau aman.
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {farmAlerts.slice(0, 4).map((alert) => (
                  <Link
                    key={alert.id}
                    href={`/admin/farms/${alert.id}`}
                    className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-black/3 transition-colors"
                    style={{ border: '1px solid rgba(181,68,59,0.15)', background: 'rgba(181,68,59,0.04)' }}
                  >
                    <AlertTriangle size={12} style={{ color: palette.danger, flexShrink: 0, marginTop: 2 }} />
                    <div className="min-w-0">
                      <div className="break-words" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, color: palette.ink }}>
                        {alert.nama}
                      </div>
                      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: palette.danger, letterSpacing: '0.05em' }}>
                        {alert.reason}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          {/* Pending Approvals */}
          {recentPending.length > 0 && (
            <Card>
              <SectionLabel>PERMOHONAN BARU</SectionLabel>
              <div className="space-y-2.5">
                {recentPending.slice(0, 3).map((u) => (
                  <div key={u.id} className="flex items-center gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(199,135,62,0.15)', color: palette.ochre, fontFamily: "'Fraunces',serif", fontSize: 12 }}
                    >
                      {u.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, color: palette.ink }} className="truncate">
                        {u.name}
                      </div>
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(13,20,15,0.5)' }} className="truncate">
                        {u.email}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <Link
                href="/admin/approvals"
                className="mt-3.5 flex items-center justify-center gap-1.5 py-2.5 sm:py-2 rounded-lg w-full text-center transition-colors hover:bg-black/5"
                style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.ochre, border: `1px solid rgba(199,135,62,0.3)` }}
              >
                Lihat semua <ArrowUpRight size={12} />
              </Link>
            </Card>
          )}
        </motion.div>
      </div>

      {/* ── INACTIVE FARM DETECTION ── */}
      {inactiveFarms.length > 0 && (
        <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible" className="mb-4">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <SectionLabel>FARM TIDAK AKTIF (30+ HARI)</SectionLabel>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink }}>
                  Farm aktif tanpa aktivitas lebih dari 30 hari
                </div>
              </div>
              <Timer size={16} style={{ color: palette.ochre, opacity: 0.7 }} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {inactiveP.paged.map((f) => (
                <Link
                  key={f.id}
                  href={`/admin/farms/${f.id}`}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-black/3 transition-colors group"
                  style={{ border: `1px solid rgba(199,135,62,0.25)`, background: 'rgba(199,135,62,0.04)' }}
                >
                  <Timer size={12} style={{ color: palette.ochre, flexShrink: 0 }} />
                  <div className="min-w-0 flex-1">
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: 500, color: palette.ink }} className="truncate">
                      {f.nama}
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: palette.ochre }}>
                      {f.reason}
                    </div>
                  </div>
                  <ArrowUpRight size={12} style={{ color: 'rgba(13,20,15,0.2)' }} className="group-hover:text-ochre shrink-0" />
                </Link>
              ))}
            </div>
            <PaginationControl
              page={inactiveP.page}
              totalPages={inactiveP.totalPages}
              onPrev={inactiveP.onPrev}
              onNext={inactiveP.onNext}
              totalItems={inactiveFarms.length}
              perPage={6}
            />
          </Card>
        </motion.div>
      )}

      {/* ── ROW 3: FARM COMPARISON + KATEGORI ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
        {/* Farm Comparison Bar */}
        <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible" className="xl:col-span-2">
          <Card>
            <div className="flex items-center justify-between" style={{ marginBottom: 16 }}>
              <div>
                <SectionLabel>BEBAN KERJA & SKALA OPERASIONAL</SectionLabel>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink }}>
                  Perbandingan jumlah hewan dan staf per farm
                </div>
              </div>
            </div>
            {(() => {
              const sorted = [...farmComparison]
                .sort((a, b) => b.hewan - a.hewan)
                .map(f => ({
                  ...f,
                  shortName: f.namaPanjang.replace(/^Farm Kosta\s*/i, ''),
                }))
              const barH = 32
              const pad = 40
              const maxVisible = 8
              const needsScroll = sorted.length > maxVisible
              const chartHeight = Math.max(300, sorted.length * barH)
              const containerMaxH = maxVisible * barH + pad
              return (
                <>
                <div className="relative">
                  <div
                    style={{
                      maxHeight: needsScroll ? containerMaxH : undefined,
                      overflowY: needsScroll ? 'auto' : undefined,
                      scrollbarWidth: 'thin',
                      scrollbarColor: 'rgba(13,20,15,0.12) transparent',
                    }}
                  >
                    <ResponsiveContainer width="100%" height={chartHeight}>
                      <BarChart data={sorted} layout="vertical" margin={{ top: 0, right: 40, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,20,15,0.05)" horizontal={false} vertical={true} />
                        <XAxis type="number" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.45)' }} axisLine={false} tickLine={false} />
                        <YAxis dataKey="shortName" type="category" width={100} tick={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, fill: 'rgba(13,20,15,0.7)' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          content={<CustomTooltip />}
                          cursor={{ fill: 'rgba(13,20,15,0.03)' }}
                        />
                        <Bar dataKey="hewan" name="Hewan" fill={palette.ochre} radius={[0, 4, 4, 0]} barSize={14} label={{ position: 'right', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.5)' }} />
                        <Bar dataKey="user" name="Staf" fill="rgba(199,135,62,0.3)" radius={[0, 4, 4, 0]} barSize={14} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {needsScroll && (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 28, pointerEvents: 'none', background: 'linear-gradient(transparent, rgba(255,255,255,0.9))' }} />
                  )}
                </div>
                {needsScroll && (
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.3)', textAlign: 'center', marginTop: 4 }}>
                    ↕ scroll · {sorted.length} farm
                  </div>
                )}
                </>
              )
            })()}
            <ChartLegend
              items={[
                { label: 'Hewan', color: palette.ochre },
                { label: 'Staf', color: 'rgba(199,135,62,0.5)' },
              ]}
            />
          </Card>
        </motion.div>

        {/* Kategori Donut */}
        <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="h-full">
            <SectionLabel>DISTRIBUSI KATEGORI</SectionLabel>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginBottom: 16 }}>
              Kategori hewan regional
            </div>
            {kategoriData.length > 0 ? (
              (() => {
                const sorted = [...kategoriData].sort((a, b) => b.value - a.value)
                return (
                  <>
                    <ResponsiveContainer width="100%" height={140}>
                      <PieChart>
                        <Pie
                          data={sorted}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={65}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {sorted.map((_, idx) => (
                            <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip {...tooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1.5 mt-3">
                      {sorted.map((k, idx) => (
                        <div key={k.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.7)' }}>{k.name}</span>
                          </div>
                          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: palette.ink, fontWeight: 500 }}>
                            {k.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )
              })()
            ) : (
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.45)', textAlign: 'center', padding: '32px 0' }}>
                Belum ada data
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── ROW 4: TOP DIAGNOSA + FARM TABLE ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Top Diagnosa */}
        <motion.div custom={11} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <SectionLabel>TOP DIAGNOSA PENYAKIT REGIONAL</SectionLabel>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginBottom: 16 }}>
              Penyakit paling umum di seluruh wilayah
            </div>
            {topDiagnosa.length === 0 ? (
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.45)', textAlign: 'center', padding: '32px 0' }}>Belum ada rekam medis.</div>
            ) : (
              <ResponsiveContainer width="100%" height={Math.max(260, topDiagnosa.length * 44)}>
                <BarChart
                  data={topDiagnosa}
                  layout="vertical"
                  margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,20,15,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.45)' }} axisLine={false} tickLine={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={140}
                    tick={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, fill: 'rgba(13,20,15,0.7)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    {...tooltipStyle}
                    formatter={(val) => [`${val} kasus`, 'Frekuensi']}
                  />
                  <Bar dataKey="count" name="Kasus" fill={palette.ochre} radius={[0, 4, 4, 0]} barSize={14} label={{ position: 'right', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.5)' }}>
                    {topDiagnosa.map((_, idx) => (
                      <Cell 
                        key={idx} 
                        fill={idx === 0 ? palette.danger : palette.ochre} 
                        opacity={1 - idx * 0.08} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        {/* Farm Overview Table with Health Score */}
        <motion.div custom={12} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <SectionLabel>DAFTAR FARM</SectionLabel>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink }}>
                  Semua farm di sistem
                </div>
              </div>
              <Link href="/admin/farms" className="shrink-0 flex items-center min-h-10" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.ochre }}>
                Lihat semua →
              </Link>
            </div>
            <div className="space-y-2">
              {farmComparison.slice(0, 6).map((f) => {
                const score = f.healthScore ?? 100
                const scoreColor = score >= 80 ? palette.moss : score >= 60 ? palette.ochre : palette.danger
                return (
                  <Link
                    key={f.id}
                    href={`/admin/farms/${f.id}`}
                    className="flex items-center justify-between gap-3 py-2.5 px-3 rounded-xl hover:bg-black/5 transition-colors group"
                    style={{ border: `1px solid ${palette.border}` }}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{ background: f.status === 'AKTIF' ? 'rgba(63,91,58,0.1)' : 'rgba(181,68,59,0.08)' }}
                      >
                        <Building2 size={13} style={{ color: f.status === 'AKTIF' ? palette.moss : palette.danger }} />
                      </div>
                      <div className="min-w-0">
                        <div className="break-words" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: 500, color: palette.ink }}>
                          {f.namaPanjang}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: f.status === 'AKTIF' ? palette.moss : palette.danger, letterSpacing: '0.08em' }}>
                          {f.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {/* Health Score */}
                      <div className="text-right">
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 14, color: scoreColor }}>{score}%</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'rgba(13,20,15,0.4)' }}>health</div>
                      </div>
                      <div className="text-right">
                        <div style={{ fontFamily: "'Fraunces',serif", fontSize: 16, color: palette.ink }}>{f.hewan}</div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, color: 'rgba(13,20,15,0.4)' }}>hewan</div>
                      </div>
                      <ArrowUpRight size={13} style={{ color: 'rgba(13,20,15,0.2)', transition: 'color 0.2s' }} className="group-hover:text-ochre" />
                    </div>
                  </Link>
                )
              })}
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
