'use client'

import { motion } from 'framer-motion'
import { Download, Trophy } from 'lucide-react'
import { usePagination } from '@/hooks/usePagination'
import PaginationControl from './PaginationControl'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
} from 'recharts'

const palette = {
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.09)',
  moss: '#3F5B3A',
  danger: '#B5443B',
  info: '#2C5F8A',
  cream: '#F2EDE0',
}

const STACKED_COLORS = {
  indukan: '#C7873E',
  pejantan: '#1B2A1F',
  anakan: '#3F5B3A',
  dara: '#9B6A1E',
  jantanMuda: '#2C5F8A',
}

const PIE_COLORS = ['#C7873E', '#3F5B3A', '#2C5F8A', '#7A5C2E', '#B5443B', '#1B5E7A', '#5B3A2E', '#2E5B4A']

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
    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 4 }}>
      {children}
    </div>
  )
}

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl p-6 ${className}`} style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
      {children}
    </div>
  )
}

interface HewanPerFarm {
  id: string; nama: string; namaPanjang: string; status: string;
  indukan: number; pejantan: number; anakan: number; dara: number; jantanMuda: number;
  total: number; mati: number; terjual: number; mortalityRate: number;
}

interface ReproPerFarm {
  nama: string; namaPanjang: string;
  lahir: number; gagal: number; hamil: number; successRate: number;
}

interface AdminAnalyticsClientProps {
  hewanPerFarm: HewanPerFarm[]
  reproduksiPerFarm: ReproPerFarm[]
  distribusiUmur: { name: string; value: number }[]
  topDiagnosa: { name: string; count: number }[]
  kategoriMedisData: { name: string; value: number }[]
}

export default function AdminAnalyticsClient({
  hewanPerFarm,
  reproduksiPerFarm,
  distribusiUmur,
  topDiagnosa,
  kategoriMedisData,
}: AdminAnalyticsClientProps) {
  const sortedFarms = [...hewanPerFarm].sort((a, b) => b.total - a.total)
  const { paged: pagedFarms, page, totalPages, onPrev, onNext } = usePagination(sortedFarms, 10)

  const sortedMortalityFarms = [...hewanPerFarm].sort((a, b) => b.mortalityRate - a.mortalityRate)
  const mortalityP = usePagination(sortedMortalityFarms, 5)
  return (
    <div>
      {/* Header */}
      <motion.div
        className="mb-10"
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)', marginBottom: 8 }}>
          ANALYTICS REGIONAL
        </div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: '-0.025em' }}>
          Analytics <span style={{ fontStyle: 'italic', color: palette.ochre }}>Regional</span>
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.55)', marginTop: 4 }}>
          Analisis mendalam perbandingan antar farm di seluruh wilayah.
        </p>

        {/* Export Excel Buttons */}
        <div className="flex flex-wrap gap-2 mt-5">
          {[
            { label: 'Farm', type: 'farms' },
            { label: 'Hewan', type: 'hewan' },
            { label: 'User', type: 'users' },
            { label: 'Semua Data', type: 'all' },
          ].map((btn) => (
            <a
              key={btn.type}
              href={`/api/admin/export?type=${btn.type}`}
              download
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all hover:opacity-80"
              style={{
                fontFamily: "'Inter',sans-serif",
                fontSize: 12,
                background: btn.type === 'all' ? 'rgba(27,42,31,0.06)' : '#fff',
                color: palette.ink,
                border: `1px solid ${btn.type === 'all' ? palette.moss : palette.border}`,
                textDecoration: 'none',
                fontWeight: btn.type === 'all' ? 500 : 400,
              }}
            >
              <Download size={12} style={{ color: btn.type === 'all' ? palette.moss : palette.ochre }} />
              {btn.type === 'all' ? 'Semua Data' : `Export ${btn.label}`} .xlsx
            </a>
          ))}
        </div>
      </motion.div>

      {/* ── STACKED BAR: Komposisi Hewan per Farm ── */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="mb-6">
        <Card>
          <SectionLabel>KOMPOSISI HEWAN PER FARM</SectionLabel>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginBottom: 20 }}>
            Distribusi kategori hewan aktif per farm
          </div>
          {hewanPerFarm.length === 0 ? (
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.45)', textAlign: 'center', padding: '32px 0' }}>
              Belum ada data farm
            </div>
          ) : (
            <div className="overflow-x-auto overflow-y-hidden" style={{ width: '100%', scrollbarWidth: 'thin' }}>
              <div style={{ minWidth: Math.max(hewanPerFarm.length * 60, 600) + 'px', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hewanPerFarm} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,20,15,0.05)" vertical={false} />
                    <XAxis dataKey="nama" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: 'rgba(13,20,15,0.5)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.45)' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#ffffff' }}
                      contentStyle={{ backgroundColor: '#0D140F', color: '#ffffff', fontFamily: "'Inter',sans-serif", fontSize: 12, borderRadius: 10, border: `1px solid ${palette.border}` }}
                      labelFormatter={(label) => {
                        const item = hewanPerFarm.find((f) => f.nama === String(label))
                        return item?.namaPanjang || String(label)
                      }}
                    />
                    <Legend wrapperStyle={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }} />
                    <Bar dataKey="indukan" name="Indukan" stackId="a" fill={STACKED_COLORS.indukan} radius={[0, 0, 0, 0]} />
                    <Bar dataKey="pejantan" name="Pejantan" stackId="a" fill={STACKED_COLORS.pejantan} />
                    <Bar dataKey="anakan" name="Anakan" stackId="a" fill={STACKED_COLORS.anakan} />
                    <Bar dataKey="dara" name="Dara" stackId="a" fill={STACKED_COLORS.dara} />
                    <Bar dataKey="jantanMuda" name="Jantan Muda" stackId="a" fill={STACKED_COLORS.jantanMuda} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </Card>
      </motion.div>

      {/* ── ROW: MORTALITY RATE TABLE + REPRODUKSI ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Mortality Rate per Farm */}
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="h-full">
            <SectionLabel>MORTALITY RATE PER FARM</SectionLabel>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginBottom: 16 }}>
              Tingkat kematian hewan per peternakan
            </div>
            <div className="space-y-3">
              {mortalityP.paged.map((farm, i) => (
                  <div key={farm.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }} className="truncate max-w-[180px]">
                        {farm.namaPanjang}
                      </span>
                      <span style={{
                        fontFamily: "'JetBrains Mono',monospace", fontSize: 10,
                        color: farm.mortalityRate > 15 ? palette.danger : farm.mortalityRate > 7 ? '#9B6A1E' : palette.moss,
                        fontWeight: 600
                      }}>
                        {farm.mortalityRate}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: 'rgba(13,20,15,0.06)' }}>
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${Math.min(farm.mortalityRate * 3, 100)}%`,
                          background: farm.mortalityRate > 15 ? palette.danger : farm.mortalityRate > 7 ? '#C7873E' : palette.moss,
                        }}
                      />
                    </div>
                    <div className="flex gap-4 mt-1">
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.4)' }}>
                        {farm.mati} mati · {farm.terjual} terjual · {farm.total} aktif
                      </span>
                    </div>
                  </div>
                ))}
            </div>
            {sortedMortalityFarms.length > 5 && (
              <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${palette.border}` }}>
                <PaginationControl
                  page={mortalityP.page}
                  totalPages={mortalityP.totalPages}
                  onPrev={mortalityP.onPrev}
                  onNext={mortalityP.onNext}
                  totalItems={sortedMortalityFarms.length}
                  perPage={5}
                />
              </div>
            )}
          </Card>
        </motion.div>

        {/* Reproduksi per Farm */}
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <Card className="h-full">
            <SectionLabel>KEBERHASILAN REPRODUKSI PER FARM</SectionLabel>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginBottom: 20 }}>
              Tingkat lahir vs gagal per farm
            </div>
            {reproduksiPerFarm.filter((f) => f.lahir + f.gagal > 0).length === 0 ? (
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.45)', textAlign: 'center', padding: '40px 0' }}>
                Belum ada data reproduksi selesai
              </div>
            ) : (
              <div className="overflow-x-auto overflow-y-hidden" style={{ width: '100%', scrollbarWidth: 'thin' }}>
                <div style={{ minWidth: Math.max(reproduksiPerFarm.filter((f) => f.lahir + f.gagal > 0).length * 60, 400) + 'px', height: 240 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reproduksiPerFarm.filter((f) => f.lahir + f.gagal > 0)}
                      margin={{ top: 4, right: 0, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(13,20,15,0.05)" vertical={false} />
                      <XAxis dataKey="nama" tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, fill: 'rgba(13,20,15,0.5)' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: 'rgba(13,20,15,0.45)' }} axisLine={false} tickLine={false} />
                      <Tooltip
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        itemStyle={{ color: '#ffffff' }}
                        labelStyle={{ color: '#ffffff' }}
                        contentStyle={{ backgroundColor: '#0D140F', color: '#ffffff', fontFamily: "'Inter',sans-serif", fontSize: 12, borderRadius: 10, border: `1px solid ${palette.border}` }}
                        labelFormatter={(label) => reproduksiPerFarm.find((f) => f.nama === String(label))?.namaPanjang || String(label)}
                      />
                      <Legend wrapperStyle={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }} />
                      <Bar dataKey="lahir" name="Berhasil Lahir" fill={palette.moss} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="gagal" name="Gagal" fill={palette.danger} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── ROW: DISTRIBUSI UMUR + KATEGORI MEDIS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Distribusi Umur */}
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <SectionLabel>DISTRIBUSI UMUR HEWAN REGIONAL</SectionLabel>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginBottom: 16 }}>
              Kelompok umur hewan aktif seluruh wilayah
            </div>
            {distribusiUmur.length === 0 ? (
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.45)', textAlign: 'center', padding: '40px 0' }}>
                Belum ada data
              </div>
            ) : (
              <div className="flex gap-4 items-center">
                <ResponsiveContainer width="55%" height={180}>
                  <PieChart>
                    <Pie data={distribusiUmur} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={2} dataKey="value">
                      {distribusiUmur.map((_, idx) => (
                        <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      itemStyle={{ color: '#ffffff' }}
                      labelStyle={{ color: '#ffffff' }}
                      contentStyle={{ backgroundColor: '#0D140F', color: '#ffffff', fontFamily: "'Inter',sans-serif", fontSize: 12, borderRadius: 10, border: `1px solid ${palette.border}` }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {distribusiUmur.map((d, idx) => (
                    <div key={d.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.7)' }}>{d.name}</span>
                      </div>
                      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: palette.ink, fontWeight: 500 }}>
                        {d.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Kategori Medis */}
        <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
          <Card>
            <SectionLabel>JENIS TINDAKAN MEDIS REGIONAL</SectionLabel>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginBottom: 16 }}>
              Distribusi kategori rekam medis seluruh farm
            </div>
            {kategoriMedisData.length === 0 ? (
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.45)', textAlign: 'center', padding: '40px 0' }}>
                Belum ada data medis
              </div>
            ) : (
              <div className="space-y-3">
                {kategoriMedisData.map((k, i) => {
                  const max = kategoriMedisData[0].value
                  return (
                    <div key={k.name}>
                      <div className="flex items-center justify-between mb-1">
                        <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}>{k.name}</span>
                        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(13,20,15,0.5)' }}>{k.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ background: 'rgba(13,20,15,0.06)' }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${Math.round((k.value / max) * 100)}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </motion.div>
      </div>

      {/* ── TOP DIAGNOSA ── */}
      <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
        <Card>
          <SectionLabel>TOP DIAGNOSA PENYAKIT REGIONAL</SectionLabel>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginBottom: 20 }}>
            8 diagnosa paling sering dicatat di seluruh wilayah
          </div>
          {topDiagnosa.length === 0 ? (
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.45)', textAlign: 'center', padding: '32px 0' }}>
              Belum ada data rekam medis
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart
                data={[...topDiagnosa].reverse()}
                layout="vertical"
                margin={{ top: 0, right: 24, left: 0, bottom: 0 }}
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
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  itemStyle={{ color: '#ffffff' }}
                  labelStyle={{ color: '#ffffff' }}
                  contentStyle={{ backgroundColor: '#0D140F', color: '#ffffff', fontFamily: "'Inter',sans-serif", fontSize: 12, borderRadius: 10, border: `1px solid ${palette.border}` }}
                  formatter={(val) => [`${val} kasus`, 'Frekuensi']}
                />
                <Bar dataKey="count" name="Kasus" fill={palette.ochre} radius={[0, 4, 4, 0]}>
                  {topDiagnosa.map((_, idx) => (
                    <Cell key={idx} fill={idx === 0 ? palette.danger : palette.ochre} opacity={1 - idx * 0.08} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      {/* ── FARM PERFORMANCE RANKING ── */}
      <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible" className="mt-6">
        <Card>
          <div className="flex items-center gap-2 mb-5">
            <Trophy size={15} style={{ color: palette.ochre }} />
            <div>
              <SectionLabel>RANKING PERFORMA FARM</SectionLabel>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink, marginTop: -12 }}>
                Peringkat farm berdasarkan jumlah hewan aktif
              </div>
            </div>
          </div>
          {hewanPerFarm.length === 0 ? (
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.45)', textAlign: 'center', padding: '32px 0' }}>
              Belum ada data farm
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${palette.border}` }}>
                    {['#', 'Farm', 'Status', 'Hewan Aktif', 'Mati', 'Terjual', 'Mortality', 'Health Score'].map((h) => (
                      <th
                        key={h}
                        style={{
                          textAlign: 'left', padding: '8px 12px',
                          fontFamily: "'JetBrains Mono',monospace", fontSize: 9,
                          letterSpacing: '0.12em', color: 'rgba(13,20,15,0.4)', fontWeight: 500,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagedFarms.map((farm, rank) => {
                    const rankActual = page * 10 + rank
                    const healthScore = farm.total > 0 ? Math.round((farm.total / (farm.total + farm.mati + farm.terjual)) * 100) : 100
                    const scoreColor = healthScore >= 80 ? palette.moss : healthScore >= 60 ? palette.ochre : palette.danger
                    const medalColor = rankActual === 0 ? '#C7873E' : rankActual === 1 ? '#9B9B9B' : rankActual === 2 ? '#C67B3A' : 'rgba(13,20,15,0.3)'
                    return (
                      <tr key={farm.id} style={{ borderBottom: `1px solid ${palette.border}` }}>
                        <td style={{ padding: '10px 12px', fontFamily: "'Fraunces',serif", fontSize: 16, color: medalColor, fontWeight: 400 }}>
                          {rankActual + 1}
                        </td>
                        <td style={{ padding: '10px 12px', fontWeight: 500 }}>{farm.namaPanjang}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: 20, fontSize: 10,
                            fontFamily: "'JetBrains Mono',monospace",
                            background: farm.status === 'AKTIF' ? 'rgba(63,91,58,0.12)' : 'rgba(181,68,59,0.1)',
                            color: farm.status === 'AKTIF' ? palette.moss : palette.danger,
                          }}>
                            {farm.status}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', fontFamily: "'Fraunces',serif", fontSize: 18, color: palette.ink }}>{farm.total}</td>
                        <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: palette.danger }}>{farm.mati}</td>
                        <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: palette.info }}>{farm.terjual}</td>
                        <td style={{ padding: '10px 12px', fontFamily: "'JetBrains Mono',monospace", fontSize: 11, color: farm.mortalityRate > 15 ? palette.danger : 'rgba(13,20,15,0.6)', fontWeight: 600 }}>
                          {farm.mortalityRate}%
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{ color: scoreColor, fontFamily: "'Fraunces',serif", fontSize: 16 }}>{healthScore}%</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
              <PaginationControl
                page={page}
                totalPages={totalPages}
                onPrev={onPrev}
                onNext={onNext}
                totalItems={hewanPerFarm.length}
                perPage={10}
              />
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
