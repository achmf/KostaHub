'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Scale, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { KostaPageHeader, KostaCard, KostaButton, KostaSectionLabel, Badge, palette } from '@/components/KostaUI'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

type HewanBerat = {
  id: string
  tag: string
  nama: string | null
  kategori: string
  farm: { nama: string } | null
  beratHistory: { id?: string; berat: number; tanggal: string }[]
  berat: number | null
}

const KATEGORI_LABEL: Record<string, string> = {
  INDUKAN: 'Indukan',
  PEJANTAN: 'Pejantan',
  ANAKAN: 'Anakan',
  DARA: 'Dara',
  JANTAN_MUDA: 'Jantan Muda',
}

const trendData = Array.from({ length: 12 }).map((_, i) => ({
  name: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'][i],
  v: 32 + Math.sin(i / 2) * 4 + i * 0.7,
}))

export default function BeratPageClient({ hewanList }: { hewanList: HewanBerat[] }) {
  const avg = Math.round(
    hewanList.reduce((s, h) => s + (h.berat ?? 0), 0) / Math.max(hewanList.length, 1)
  )
  const top = [...hewanList].sort((a, b) => (b.berat ?? 0) - (a.berat ?? 0))[0]

  return (
    <div>
      <KostaPageHeader
        title="Monitoring Pertumbuhan"
        description="Catat penimbangan rutin untuk melacak kurva pertumbuhan tiap individu."
        action={
          <Link href="/berat/tambah">
            <KostaButton>
              <Plus size={13} /> Catat Penimbangan
            </KostaButton>
          </Link>
        }
      />

      {/* Top charts row */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <KostaCard className="col-span-12 lg:col-span-7 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <KostaSectionLabel>RATA-RATA BERAT POPULASI · 12 BULAN</KostaSectionLabel>
              <div className="mt-2" style={{ fontFamily: "'Fraunces',serif", fontSize: 44, letterSpacing: '-0.025em' }}>
                {avg}
                <span className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>
                  {' '}kg
                </span>
              </div>
            </div>
            <Badge variant="moss">
              <TrendingUp size={11} /> +8.4%
            </Badge>
          </div>
          <div className="h-44">
            <ResponsiveContainer>
              <LineChart data={trendData}>
                <XAxis
                  dataKey="name"
                  tickFormatter={(val) => val.charAt(0)}
                  tickLine={false}
                  axisLine={false}
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: palette.ink, opacity: 0.6 }}
                />
                <Tooltip
                  contentStyle={{
                    background: palette.ink,
                    color: palette.cream,
                    border: 'none',
                    borderRadius: 8,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="v"
                  stroke={palette.moss}
                  strokeWidth={2.5}
                  dot={{ fill: palette.ochre, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </KostaCard>

        <div className="col-span-12 lg:col-span-5 grid grid-cols-2 gap-4">
          {[
            { l: 'Total dimonitor', v: hewanList.length, sub: 'ekor aktif' },
            { l: 'Berat tertinggi', v: top ? `${top.berat}` : '0', sub: top?.nama || top?.tag || '—' },
            { l: 'Penimbangan minggu ini', v: 28, sub: 'tercatat' },
            { l: 'Target bulan ini', v: '85%', sub: 'tercapai' },
          ].map((s, i) => (
            <motion.div
              key={s.l}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="rounded-2xl p-5"
              style={{
                background: i === 1 ? palette.ink : '#fff',
                color: i === 1 ? palette.cream : palette.ink,
                border: i === 1 ? 'none' : `1px solid ${palette.border}`,
              }}
            >
              <KostaSectionLabel>
                <span style={{ color: i === 1 ? 'rgba(242,237,224,0.55)' : undefined }}>{s.l}</span>
              </KostaSectionLabel>
              <div className="mt-2" style={{ fontFamily: "'Fraunces',serif", fontSize: 30, lineHeight: 1, letterSpacing: '-0.02em' }}>
                {s.v}
              </div>
              <div className="mt-1 opacity-60" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5 }}>
                {s.sub}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Table */}
      <KostaCard className="overflow-hidden">
        <div
          className="px-5 py-3 grid grid-cols-[1.6fr_1fr_1fr_1.4fr_0.6fr] gap-3"
          style={{
            background: 'rgba(13,20,15,0.03)',
            borderBottom: `1px solid ${palette.border}`,
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            letterSpacing: '0.12em',
            color: 'rgba(13,20,15,0.55)',
          }}
        >
          <div>HEWAN</div>
          <div>KATEGORI</div>
          <div>BERAT TERKINI</div>
          <div>TREND</div>
          <div className="text-right">AKSI</div>
        </div>
        {hewanList.length === 0 && (
          <div className="py-16 text-center" style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontStyle: 'italic', color: palette.moss }}>
            Belum ada hewan aktif.
          </div>
        )}
        {hewanList.slice(0, 20).map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.02, 0.4) }}
            className="px-5 py-3.5 grid grid-cols-[1.6fr_1fr_1fr_1.4fr_0.6fr] gap-3 items-center"
            style={{ borderBottom: `1px solid ${palette.border}` }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(63,91,58,0.12)', color: palette.moss, fontFamily: "'Fraunces',serif", fontSize: 13 }}
              >
                {(h.nama || h.tag).slice(0, 1)}
              </div>
              <div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>{h.nama || 'Tanpa Nama'}</div>
                <div className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>
                  {h.tag}
                </div>
              </div>
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>
              {KATEGORI_LABEL[h.kategori] ?? h.kategori}
            </div>
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 18, letterSpacing: '-0.02em' }}>
              {h.berat ?? '—'}
              <span className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}> kg</span>
            </div>
            {/* Mini bar trend */}
            <div className="flex items-end gap-0.5 h-7">
              {h.beratHistory.slice(-5).map((bh, k, arr) => (
                <motion.div
                  key={k}
                  initial={{ height: 0 }}
                  animate={{
                    height: `${(bh.berat / ((arr[arr.length - 1]?.berat ?? bh.berat) + 3)) * 100}%`,
                  }}
                  transition={{ delay: 0.3 + k * 0.05, duration: 0.5 }}
                  className="w-1.5 rounded-sm"
                  style={{ background: k === arr.length - 1 ? palette.ochre : palette.mossSoft }}
                />
              ))}
            </div>
            <div className="text-right">
              <Link href={`/berat/tambah?hewanId=${h.id}`}>
                <KostaButton variant="outline" size="sm">
                  <Scale size={11} /> Timbang
                </KostaButton>
              </Link>
            </div>
          </motion.div>
        ))}
      </KostaCard>
    </div>
  )
}
