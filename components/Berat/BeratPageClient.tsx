'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Scale, Plus, TrendingUp, Search, Filter, X, Calendar } from 'lucide-react'
import Link from 'next/link'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { KostaPageHeader, KostaCard, KostaButton, KostaSectionLabel, Badge, KostaEmptyState, palette } from '@/components/KostaUI'
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'

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

// trendData is now dynamic inside the component

export default function BeratPageClient({ hewanList }: { hewanList: HewanBerat[] }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [kat, setKat] = useState<string>('ALL')
  const [timeRange, setTimeRange] = useState('1y')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const PER_PAGE = 15

  const trendData = useMemo(() => {
    if (timeRange === '1y') {
      return Array.from({ length: 12 }).map((_, i) => ({
        name: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'][i],
        v: 32 + Math.sin(i / 2) * 4 + i * 0.7,
      }))
    }
    if (timeRange === '6m') {
      return Array.from({ length: 6 }).map((_, i) => ({
        name: ['Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'][i],
        v: 35 + Math.sin(i) * 2,
      }))
    }
    if (timeRange === '3m') {
      return Array.from({ length: 3 }).map((_, i) => ({
        name: ['Okt', 'Nov', 'Des'][i],
        v: 37 + Math.sin(i) * 2,
      }))
    }
    if (timeRange === '1m') {
      return Array.from({ length: 4 }).map((_, i) => ({
        name: `Mgg ${i + 1}`,
        v: 38 + Math.sin(i) * 2,
      }))
    }
    // custom
    if (customStart && customEnd) {
      const start = new Date(customStart)
      const end = new Date(customEnd)
      
      let diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
      if (diffMonths < 0) diffMonths = 0
      
      const diffTime = end.getTime() - start.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays <= 0) return []
      
      if (diffDays <= 31) {
        return Array.from({ length: diffDays }).map((_, i) => {
          const d = new Date(start)
          d.setDate(d.getDate() + i)
          return {
            name: `${d.getDate()}/${d.getMonth()+1}`,
            v: 37 + Math.sin(i) * 2 + (i * 0.1)
          }
        })
      } else if (diffDays <= 90) {
        const weeks = Math.ceil(diffDays / 7)
        return Array.from({ length: weeks }).map((_, i) => {
          const d = new Date(start)
          d.setDate(d.getDate() + i * 7)
          return {
            name: `W${i+1} ${d.getDate()}/${d.getMonth()+1}`,
            v: 37 + Math.sin(i) * 2 + (i * 0.2)
          }
        })
      } else {
        return Array.from({ length: diffMonths + 1 }).map((_, i) => {
          const d = new Date(start)
          d.setMonth(d.getMonth() + i)
          const m = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'][d.getMonth()]
          const yr = String(d.getFullYear()).slice(-2)
          return {
            name: `${m} '${yr}`,
            v: 37 + Math.sin(i) * 2 + (i * 0.5)
          }
        })
      }
    }

    return Array.from({ length: 5 }).map((_, i) => ({
      name: `Point ${i+1}`,
      v: 37 + Math.random() * 5,
    }))
  }, [timeRange, customStart, customEnd])

  const filteredHewanList = useMemo(() => {
    return hewanList.filter((h) => {
      if (kat !== 'ALL' && h.kategori !== kat) return false
      if (searchQuery) {
        const lowerQ = searchQuery.toLowerCase()
        if (
          !h.nama?.toLowerCase().includes(lowerQ) &&
          !h.tag.toLowerCase().includes(lowerQ) &&
          !h.kategori.toLowerCase().includes(lowerQ)
        ) {
          return false
        }
      }
      return true
    })
  }, [hewanList, searchQuery, kat])

  const { paged, page, totalPages, onPrev, onNext, setPage } = usePagination(filteredHewanList, PER_PAGE)
  
  // Reset pagination to first page when search query or filter changes
  useEffect(() => {
    setPage(0)
  }, [searchQuery, kat, setPage])

  const activeFilterCount = kat !== 'ALL' ? 1 : 0
  const cats = ['ALL', 'INDUKAN', 'PEJANTAN', 'ANAKAN', 'DARA', 'JANTAN_MUDA']

  const avg = Math.round(
    filteredHewanList.reduce((s, h) => s + (h.berat ?? 0), 0) / Math.max(filteredHewanList.length, 1)
  )
  const top = [...filteredHewanList].sort((a, b) => (b.berat ?? 0) - (a.berat ?? 0))[0]

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
              <KostaSectionLabel>RATA-RATA BERAT POPULASI</KostaSectionLabel>
              <div className="mt-2" style={{ fontFamily: "'Fraunces',serif", fontSize: 44, letterSpacing: '-0.025em' }}>
                {avg}
                <span className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 14 }}>
                  {' '}kg
                </span>
              </div>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-3">
                <div className="relative flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[
                      { val: '1m', label: '1 Bln' },
                      { val: '3m', label: '3 Bln' },
                      { val: '6m', label: '6 Bln' },
                      { val: '1y', label: '1 Thn' }
                    ].map(opt => (
                      <button 
                        key={opt.val}
                        onClick={() => setTimeRange(opt.val)}
                        className="cursor-pointer px-2.5 py-1 rounded-full transition-all hover:bg-black/5" 
                        style={{ 
                          fontFamily: "'JetBrains Mono', monospace", 
                          fontSize: 9.5, 
                          letterSpacing: '0.08em', 
                          border: timeRange === opt.val ? '1px solid rgb(13, 20, 15)' : '1px solid rgba(13, 20, 15, 0.1)', 
                          background: timeRange === opt.val ? 'rgb(13, 20, 15)' : 'transparent', 
                          color: timeRange === opt.val ? 'rgb(242, 237, 224)' : 'rgba(13, 20, 15, 0.5)' 
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <Popover open={timeRange === 'custom'} onOpenChange={(open) => setTimeRange(open ? 'custom' : '1y')}>
                    <PopoverTrigger 
                      className="p-1.5 rounded-full transition-all cursor-pointer relative z-10 hover:bg-black/5" 
                      title="Custom Date" 
                      style={{ 
                        background: timeRange === 'custom' ? 'rgba(13,20,15,0.05)' : 'transparent', 
                        border: timeRange === 'custom' ? '1px solid rgba(13,20,15,0.3)' : '1px solid rgba(13, 20, 15, 0.1)' 
                      }}
                    >
                      <Calendar size={14} style={{ color: timeRange === 'custom' ? 'rgb(13,20,15)' : 'rgba(13,20,15,0.5)' }} />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-3" align="end">
                      <div className="flex items-center gap-2">
                        <input 
                          type="date" 
                          value={customStart}
                          onChange={e => setCustomStart(e.target.value)}
                          className="px-2 py-1 rounded-md outline-none border transition-colors"
                          style={{ 
                            background: 'rgba(13,20,15,0.03)', 
                            borderColor: 'rgba(13,20,15,0.1)',
                            fontFamily: "'Inter', sans-serif", fontSize: 11
                          }}
                        />
                        <span style={{ fontSize: 10, opacity: 0.5 }}>-</span>
                        <input 
                          type="date" 
                          value={customEnd}
                          onChange={e => setCustomEnd(e.target.value)}
                          className="px-2 py-1 rounded-md outline-none border transition-colors"
                          style={{ 
                            background: 'rgba(13,20,15,0.03)', 
                            borderColor: 'rgba(13,20,15,0.1)',
                            fontFamily: "'Inter', sans-serif", fontSize: 11
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Badge variant="moss">
                <TrendingUp size={11} /> +8.4%
              </Badge>
            </div>
          </div>
          <div className="h-44 w-full overflow-x-auto custom-scrollbar">
            <div style={{ minWidth: trendData.length > 12 ? `${trendData.length * 40}px` : '100%', height: '100%' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, fill: palette.ink, opacity: 0.6 }}
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
        {/* Search & Filter Row */}
        <div className="px-5 py-4 border-b border-[rgba(13,20,15,0.05)] flex items-center justify-between">
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(13,20,15,0.4)]" size={14} />
            <input
              type="text"
              placeholder="Cari nama, tag, atau kategori..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg text-[13px] bg-[rgba(13,20,15,0.03)] border border-[rgba(13,20,15,0.1)] outline-none focus:border-[rgba(63,91,58,0.5)] focus:ring-1 focus:ring-[rgba(63,91,58,0.5)] transition-all"
              style={{ fontFamily: "'Inter', sans-serif" }}
            />
          </div>
          <div>
            <KostaButton variant="outline" onClick={() => setIsFilterOpen(true)}>
              <Filter size={13} /> 
              Filter {activeFilterCount > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-[rgba(13,20,15,0.1)] flex items-center justify-center text-[10px]">{activeFilterCount}</span>}
            </KostaButton>
          </div>
        </div>

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
        {hewanList.length === 0 ? (
          <KostaEmptyState
            title="Belum ada hewan aktif"
            hint="Tambahkan hewan terlebih dahulu untuk mulai monitoring berat badan."
          />
        ) : filteredHewanList.length === 0 ? (
          <KostaEmptyState
            title="Hewan tidak ditemukan"
            hint={`Tidak ada hasil untuk pencarian "${searchQuery}".`}
          />
        ) : null}
        {paged.map((h, i) => (
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

        {filteredHewanList.length > 0 && (
          <div className="px-5 pb-5">
            <PaginationControl
              page={page}
              totalPages={totalPages}
              onPrev={onPrev}
              onNext={onNext}
              totalItems={filteredHewanList.length}
              perPage={PER_PAGE}
            />
          </div>
        )}
      </KostaCard>

      {/* Filter Drawer */}
      {typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {isFilterOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-40"
                  style={{ background: 'rgba(13,20,15,0.2)', backdropFilter: 'blur(2px)' }}
                  onClick={() => setIsFilterOpen(false)}
                />
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 40 }}
                  className="fixed top-0 right-0 bottom-0 w-full max-w-sm z-50 flex flex-col shadow-2xl"
                  style={{ background: palette.cream, borderLeft: `1px solid ${palette.border}` }}
                >
                  <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: `1px solid ${palette.border}` }}>
                    <h3 style={{ fontFamily: "'Fraunces',serif", fontSize: 20, color: palette.ink }}>Filter Hewan</h3>
                    <button onClick={() => setIsFilterOpen(false)} className="cursor-pointer p-2 rounded-full hover:bg-[rgba(13,20,15,0.05)]">
                      <X size={16} />
                    </button>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-8">
                    {/* Kategori */}
                    <div>
                      <KostaSectionLabel className="mb-3">KATEGORI</KostaSectionLabel>
                      <div className="flex flex-wrap gap-2">
                        {cats.map((c) => (
                          <button
                            key={c}
                            onClick={() => setKat(c)}
                            className="cursor-pointer px-4 py-2 rounded-full border transition-colors"
                            style={{
                              fontFamily: "'Inter',sans-serif", fontSize: 12,
                              background: kat === c ? palette.ink : 'transparent',
                              color: kat === c ? palette.cream : palette.ink,
                              borderColor: kat === c ? palette.ink : palette.border
                            }}
                          >
                            {c === 'ALL' ? 'Semua' : KATEGORI_LABEL[c] ?? c}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-5" style={{ borderTop: `1px solid ${palette.border}` }}>
                    <div className="flex gap-3">
                      <KostaButton 
                        variant="outline" 
                        className="flex-1 justify-center"
                        onClick={() => {
                          setKat('ALL')
                        }}
                      >
                        Reset
                      </KostaButton>
                      <KostaButton 
                        className="flex-1 justify-center"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        Terapkan
                      </KostaButton>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}
    </div>
  )
}
