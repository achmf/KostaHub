'use client'

import { useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { Download, Printer, FileSpreadsheet } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import { KostaPageHeader, KostaCard, KostaButton, Badge, KostaSectionLabel, palette } from '@/components/KostaUI'

type TabType = 'populasi' | 'reproduksi' | 'medis' | 'mutasi'

const pieColors = [palette.moss, palette.ink, palette.ochre, palette.mossSoft, palette.ochreSoft]

export default function LaporanClient({ data, isGlobal, farmName }: { data: any; isGlobal: boolean; farmName: string }) {
  const [tab, setTab] = useState<TabType>('populasi')

  const totalGlobal = (data.farmChartData as any[]).reduce((a: number, f: any) => a + f.populasi, 0)

  const katPie: { name: string; value: number }[] = data.kategoriChartData ?? []
  const farmBar = (data.farmChartData as any[]).map((f: any) => ({ name: f.name.replace('Farm ', ''), v: f.populasi }))
  const medisBar = (data.medisChartData as any[]).map((f: any) => ({ name: f.name.replace('Farm ', ''), v: f.kasus }))

  return (
    <div>
      <KostaPageHeader
        title={isGlobal ? "Audit Lintas Cabang" : `Laporan ${farmName}`}
        description={isGlobal 
          ? "Konsolidasi data populasi, reproduksi, rekam medis, dan mutasi antar farm." 
          : "Statistik operasional data populasi, reproduksi, rekam medis, dan mutasi farm Anda."}
        action={
          <div className="flex gap-2">
            <KostaButton variant="outline" onClick={() => window.print()}>
              <FileSpreadsheet size={13} /> Export Excel
            </KostaButton>
            <KostaButton onClick={() => window.print()}>
              <Printer size={13} /> Cetak PDF
            </KostaButton>
          </div>
        }
      />

      {/* Executive summary + population bar */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <KostaCard
          className="col-span-12 lg:col-span-5 p-6"
          style={{ background: palette.ink, color: palette.cream, border: 'none' }}
        >
          <KostaSectionLabel>
            <span style={{ color: 'rgba(242,237,224,0.55)' }}>EXECUTIVE SUMMARY</span>
          </KostaSectionLabel>
          <div
            className="mt-3"
            style={{ fontFamily: "'Fraunces',serif", fontSize: 28, lineHeight: 1.05, letterSpacing: '-0.02em' }}
          >
            {isGlobal 
              ? `${data.farmChartData?.length ?? 0} farm aktif beroperasi di seluruh Jawa Barat.` 
              : `Ringkasan performa operasional untuk ${farmName}.`}
          </div>
          <div className="mt-6 grid grid-cols-3 gap-4">
            {[
              { l: isGlobal ? 'Populasi global' : 'Populasi total', v: totalGlobal },
              { l: 'Kasus medis', v: data.medisData?.length ?? 0 },
              { l: 'Mutasi tercatat', v: data.mutasiData?.length ?? 0 },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 36, letterSpacing: '-0.025em' }}>{s.v}</div>
                <div className="opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </KostaCard>

        <KostaCard className="col-span-12 lg:col-span-7 p-6">
          <div className="flex items-center justify-between mb-3">
            <KostaSectionLabel>{isGlobal ? 'DISTRIBUSI POPULASI PER FARM' : 'DISTRIBUSI POPULASI'}</KostaSectionLabel>
            <Badge variant="moss">AKTIF</Badge>
          </div>
          <div className="h-52">
            <ResponsiveContainer>
              <BarChart data={farmBar}>
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={false}
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: palette.ink, opacity: 0.6 }}
                />
                <Tooltip
                  contentStyle={{ background: palette.ink, color: palette.cream, border: 'none', borderRadius: 8, fontFamily: "'Inter',sans-serif", fontSize: 12 }}
                />
                <Bar dataKey="v" fill={palette.moss} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </KostaCard>
      </div>

      {/* Category pie + medis bar */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <KostaCard className="col-span-12 lg:col-span-5 p-6">
          <KostaSectionLabel>{isGlobal ? 'RASIO KATEGORI GLOBAL' : 'RASIO KATEGORI'}</KostaSectionLabel>
          <div className="flex items-center gap-4 mt-3">
            <div className="w-40 h-40">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={katPie} dataKey="value" innerRadius={42} outerRadius={70} paddingAngle={2} stroke="none">
                    {katPie.map((_, i) => <Cell key={i} fill={pieColors[i]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 grid gap-1.5">
              {katPie.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full" style={{ background: pieColors[i] }} />
                  <span className="flex-1" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12 }}>{p.name}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </KostaCard>

        <KostaCard className="col-span-12 lg:col-span-7 p-6">
          <KostaSectionLabel>{isGlobal ? 'FREKUENSI MEDIS PER FARM' : 'FREKUENSI MEDIS'}</KostaSectionLabel>
          <div className="h-52 mt-3">
            <ResponsiveContainer>
              <BarChart data={medisBar} layout="vertical" margin={{ left: 30 }}>
                <YAxis
                  dataKey="name"
                  type="category"
                  axisLine={false}
                  tickLine={false}
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: palette.ink, opacity: 0.6 }}
                />
                <XAxis type="number" hide />
                <Tooltip
                  contentStyle={{ background: palette.ink, color: palette.cream, border: 'none', borderRadius: 8, fontFamily: "'Inter',sans-serif", fontSize: 12 }}
                />
                <Bar dataKey="v" fill={palette.ochre} radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </KostaCard>
      </div>

      {/* Multi-tab detail table */}
      <KostaCard className="overflow-hidden">
        <div className="flex border-b" style={{ borderColor: palette.border }}>
          {([
            ['populasi', 'Populasi', data.populasiData?.length ?? 0],
            ['reproduksi', 'Reproduksi', data.reproduksiData?.length ?? 0],
            ['medis', 'Rekam Medis', data.medisData?.length ?? 0],
            ['mutasi', 'Mutasi & Transfer', data.mutasiData?.length ?? 0],
          ] as const).map(([k, l, n]) => (
            <button
              key={k}
              onClick={() => setTab(k as TabType)}
              className="cursor-pointer relative px-5 py-4 flex items-center gap-2"
              style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
            >
              <span style={{ opacity: tab === k ? 1 : 0.55 }}>{l}</span>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.5 }}>{n}</span>
              {tab === k && (
                <motion.div
                  layoutId="tab-line"
                  className="absolute left-3 right-3 -bottom-px h-0.5"
                  style={{ background: palette.ink }}
                />
              )}
            </button>
          ))}
          <div className="ml-auto px-5 py-3 flex items-center">
            <KostaButton variant="ghost" size="sm">
              <Download size={12} /> Unduh
            </KostaButton>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {tab === 'populasi' && (
            <motion.div key="populasi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TableHeader cols={['TAG', 'KATEGORI', 'FARM', 'BERAT', 'TERDAFTAR']} grid="0.9fr_1fr_1fr_0.6fr_0.8fr" />
              {(data.populasiData ?? []).slice(0, 20).map((h: any, i: number) => (
                <TableRow key={h.id} i={i} grid="0.9fr_1fr_1fr_0.6fr_0.8fr" cells={[
                  <span key="t" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>{h.tag}</span>,
                  <span key="k" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{h.kategori}</span>,
                  <span key="f" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{h.farm?.nama?.replace('Farm ', '')}</span>,
                  <span key="b" style={{ fontFamily: "'Fraunces',serif", fontSize: 14 }}>{h.berat ?? '—'}kg</span>,
                  <span key="d" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{new Date(h.createdAt).toLocaleDateString('id-ID')}</span>,
                ]} />
              ))}
            </motion.div>
          )}
          {tab === 'reproduksi' && (
            <motion.div key="reproduksi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TableHeader cols={['INDUK', 'PEJANTAN', 'FARM', 'TGL KAWIN', 'STATUS']} grid="1fr_1fr_0.7fr_0.8fr_0.6fr" />
              {(data.reproduksiData ?? []).slice(0, 20).map((r: any, i: number) => (
                <TableRow key={r.id} i={i} grid="1fr_1fr_0.7fr_0.8fr_0.6fr" cells={[
                  <span key="i" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{r.induk?.tag}</span>,
                  <span key="p" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{r.pejantan?.tag}</span>,
                  <span key="f" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{r.induk?.farm?.nama?.replace('Farm ', '')}</span>,
                  <span key="k" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{new Date(r.tanggalKawin).toLocaleDateString('id-ID')}</span>,
                  <Badge key="s" variant={r.status === 'HAMIL' ? 'amber' : r.status === 'LAHIR' ? 'emerald' : 'rose'}>{r.status}</Badge>,
                ]} />
              ))}
            </motion.div>
          )}
          {tab === 'medis' && (
            <motion.div key="medis" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TableHeader cols={['TAG', 'TANGGAL', 'DIAGNOSIS', 'OBAT', 'DOKTER']} grid="0.7fr_0.7fr_1.4fr_0.8fr_0.8fr" />
              {(data.medisData ?? []).slice(0, 20).map((m: any, i: number) => (
                <TableRow key={m.id} i={i} grid="0.7fr_0.7fr_1.4fr_0.8fr_0.8fr" cells={[
                  <span key="t" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{m.hewan?.tag}</span>,
                  <span key="d" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{new Date(m.tanggal).toLocaleDateString('id-ID')}</span>,
                  <span key="g" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{m.diagnosis}</span>,
                  <Badge key="o" variant="moss">{m.obat || '—'}</Badge>,
                  <span key="k" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{m.dokter || '—'}</span>,
                ]} />
              ))}
            </motion.div>
          )}
          {tab === 'mutasi' && (
            <motion.div key="mutasi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <TableHeader cols={['TAG', 'DARI', 'KE', 'TANGGAL', 'ALASAN']} grid="0.7fr_0.8fr_0.8fr_0.7fr_1.4fr" />
              {(data.mutasiData ?? []).slice(0, 20).map((t: any, i: number) => (
                <TableRow key={t.id} i={i} grid="0.7fr_0.8fr_0.8fr_0.7fr_1.4fr" cells={[
                  <span key="t" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{t.hewan?.tag}</span>,
                  <span key="d" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{t.fromFarm?.nama?.replace('Farm ', '')}</span>,
                  <span key="k" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{t.toFarm?.nama?.replace('Farm ', '')}</span>,
                  <span key="g" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>{new Date(t.tanggal).toLocaleDateString('id-ID')}</span>,
                  <span key="a" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>{t.alasan || '—'}</span>,
                ]} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </KostaCard>
    </div>
  )
}

function TableHeader({ cols, grid }: { cols: string[]; grid: string }) {
  return (
    <div
      className="px-5 py-3"
      style={{
        display: 'grid',
        gridTemplateColumns: grid,
        gap: 12,
        background: 'rgba(13,20,15,0.03)',
        borderBottom: `1px solid ${palette.border}`,
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 10,
        letterSpacing: '0.12em',
        color: 'rgba(13,20,15,0.55)',
      }}
    >
      {cols.map((c) => <div key={c}>{c}</div>)}
    </div>
  )
}

function TableRow({ cells, grid, i }: { cells: React.ReactNode[]; grid: string; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: Math.min(i * 0.015, 0.3) }}
      className="px-5 py-3"
      style={{
        display: 'grid',
        gridTemplateColumns: grid,
        gap: 12,
        alignItems: 'center',
        borderBottom: `1px solid ${palette.border}`,
      }}
    >
      {cells.map((c, k) => <div key={k}>{c}</div>)}
    </motion.div>
  )
}
