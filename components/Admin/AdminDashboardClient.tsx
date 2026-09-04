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
  Legend,
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
  Baby,
  Minus,
  Flame,
  Timer,
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
  trendData: { label: string; masuk: number; mati: number; terjual: number }[]
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
      className="mb-5"
      style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.45)' }}
    >
      {children}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: '#fff', border: `1px solid ${palette.border}` }}
    >
      {children}
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
      href: '/admin/analytics',
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
      icon: Heart,
      color: stats.mortalityRate > 10 ? palette.danger : palette.moss,
      bg: stats.mortalityRate > 10 ? 'rgba(181,68,59,0.08)' : 'rgba(63,91,58,0.10)',
      href: '/admin/analytics',
      trendKey: 'hewanMati' as const,
      invertedDanger: true,
    },
    {
      label: 'Keberhasilan Reproduksi',
      value: `${stats.birthSuccessRate}%`,
      sub: `${stats.totalHamil} sedang hamil`,
      icon: Baby,
      color: palette.ochre,
      bg: 'rgba(199,135,62,0.08)',
      href: '/admin/analytics',
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
        className="mb-10"
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
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-10">
        {kpiCards.map((card, i) => {
          const Icon = card.icon
          const trendData2 = card.trendKey ? trend[card.trendKey] : null
          return (
            <motion.div key={card.label} custom={i} variants={fadeUp} initial="hidden" animate="visible">
              <Link href={card.href} className="block group">
                <div
                  className="rounded-2xl p-5 h-full transition-all group-hover:shadow-md group-hover:-translate-y-0.5"
                  style={{ background: '#fff', border: `1px solid ${palette.border}` }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: card.bg }}>
                      <Icon size={17} style={{ color: card.color }} />
                    </div>
                    <div className="flex items-center gap-2">
                      {trendData2 && (
                        <TrendBadge delta={trendData2.delta} invertedDanger={card.invertedDanger} />
                      )}
                      <ArrowUpRight size={14} style={{ color: 'rgba(13,20,15,0.25)', transition: 'color 0.2s' }} className="group-hover:text-ochre mt-1" />
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 28, fontWeight: 400, color: palette.ink, lineHeight: 1 }}>
                    {card.value}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.5)', marginTop: 6 }}>
                    {card.label.toUpperCase()}
                  </div>
                  <div className="flex items-center justify-between mt-2">
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
            <div className="flex items-center justify-between mb-5">
              <div>
                <SectionLabel>TREN POPULASI REGIONAL</SectionLabel>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginTop: -12 }}>
                  Pergerakan hewan 6 bulan terakhir
                </div>
              </div>
              <TrendingUp size={16} style={{ color: palette.ochre, opacity: 0.7 }} />
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradMasuk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={palette.ochre} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={palette.ochre} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradMati" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={palette.danger} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={palette.danger} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,20,15,0.05)" />
                <XAxis dataKey="label" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.45)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.45)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                  contentStyle={{ backgroundColor: '#0D140F', color: '#ffffff', fontFamily: "'Inter',sans-serif", fontSize: 12, borderRadius: 10, border: `1px solid ${palette.border}`, opacity: 1 }}
                />
                <Legend wrapperStyle={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }} />
                <Area type="monotone" dataKey="masuk" name="Masuk" stroke={palette.ochre} strokeWidth={2} fill="url(#gradMasuk)" />
                <Area type="monotone" dataKey="mati" name="Mati" stroke={palette.danger} strokeWidth={2} fill="url(#gradMati)" />
                <Area type="monotone" dataKey="terjual" name="Terjual" stroke={palette.info} strokeWidth={2} fill="none" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
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
                    className="flex items-center justify-between p-2.5 rounded-lg hover:bg-black/3 transition-colors"
                    style={{ border: '1px solid rgba(181,68,59,0.2)', background: 'rgba(181,68,59,0.05)' }}
                  >
                    <div className="flex items-center gap-2">
                      <Flame size={11} style={{ color: palette.danger, flexShrink: 0 }} />
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, color: palette.ink }}>{f.nama}</span>
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
              <div className="flex flex-col items-center justify-center py-6 gap-2">
                <CheckCircle2 size={22} style={{ color: palette.moss }} />
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>
                  Semua farm normal
                </span>
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
                    <div>
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 500, color: palette.ink }}>
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
                className="mt-3.5 flex items-center justify-center gap-1.5 py-2 rounded-lg w-full text-center transition-colors hover:bg-black/5"
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
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginTop: -12 }}>
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
            <div className="flex items-center justify-between mb-5">
              <div>
                <SectionLabel>PERBANDINGAN ANTAR FARM</SectionLabel>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginTop: -12 }}>
                  Jumlah hewan per farm
                </div>
              </div>
              <Link href="/admin/analytics" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.ochre }}>
                Detail →
              </Link>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={farmComparison} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,20,15,0.05)" vertical={false} />
                <XAxis dataKey="nama" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: 'rgba(13,20,15,0.45)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.45)' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                  formatter={(val, name) => [val, name === 'hewan' ? 'Hewan' : 'User']}
                  contentStyle={{ backgroundColor: '#0D140F', color: '#ffffff', fontFamily: "'Inter',sans-serif", fontSize: 12, borderRadius: 10, border: `1px solid ${palette.border}`, opacity: 1 }}
                  labelFormatter={(label) => {
                    const item = farmComparison.find((f) => f.nama === String(label))
                    return item?.namaPanjang || String(label)
                  }}
                />
                <Bar dataKey="hewan" name="Hewan" fill={palette.ochre} radius={[4, 4, 0, 0]} />
                <Bar dataKey="user" name="User" fill="rgba(199,135,62,0.3)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Kategori Donut */}
        <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="h-full">
            <SectionLabel>DISTRIBUSI KATEGORI</SectionLabel>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginTop: -12, marginBottom: 16 }}>
              Kategori hewan regional
            </div>
            {kategoriData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={140}>
                  <PieChart>
                    <Pie
                      data={kategoriData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {kategoriData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#ffffff' }}
                      contentStyle={{ backgroundColor: '#0D140F', color: '#ffffff', fontFamily: "'Inter',sans-serif", fontSize: 12, borderRadius: 10, border: `1px solid ${palette.border}`, opacity: 1 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {kategoriData.map((k, idx) => (
                    <div key={k.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.7)' }}>{k.name}</span>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: palette.ink, fontWeight: 500 }}>
                        {k.value}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-32" style={{ color: 'rgba(13,20,15,0.4)', fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
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
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginTop: -12, marginBottom: 16 }}>
              Penyakit paling umum di seluruh wilayah
            </div>
            {topDiagnosa.length === 0 ? (
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>Belum ada rekam medis.</div>
            ) : (
              <div className="space-y-3">
                {topDiagnosa.map((d, i) => {
                  const max = topDiagnosa[0].count
                  const pct = Math.round((d.count / max) * 100)
                  return (
                    <div key={d.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}>{d.name}</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(13,20,15,0.5)' }}>
                          {d.count}×
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(13,20,15,0.07)' }}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: i === 0 ? palette.danger : palette.ochre, opacity: 1 - i * 0.12 }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* Farm Overview Table with Health Score */}
        <motion.div custom={12} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <SectionLabel>DAFTAR FARM</SectionLabel>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginTop: -12 }}>
                  Semua farm di sistem
                </div>
              </div>
              <Link href="/admin/farms" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.ochre }}>
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
                    className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-black/5 transition-colors group"
                    style={{ border: `1px solid ${palette.border}` }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: f.status === 'AKTIF' ? 'rgba(63,91,58,0.1)' : 'rgba(181,68,59,0.08)' }}
                      >
                        <Building2 size={13} style={{ color: f.status === 'AKTIF' ? palette.moss : palette.danger }} />
                      </div>
                      <div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, fontWeight: 500, color: palette.ink }}>
                          {f.namaPanjang}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: f.status === 'AKTIF' ? palette.moss : palette.danger, letterSpacing: '0.08em' }}>
                          {f.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
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
