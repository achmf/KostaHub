'use client'

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Hewan } from '@prisma/client'
import {
  KostaPageHeader,
  KostaCard,
  Badge,
  KostaButton,
  KostaEmptyState,
  KostaSectionLabel,
  palette,
} from '@/components/KostaUI'

type HewanWithRelations = Hewan & {
  farm: { nama: string }
  beratHistory?: { id: string; tanggal: Date; berat: number }[]
  rekamMedis?: { id: string }[]
}

const KATEGORI_LABEL: Record<string, string> = {
  INDUKAN: 'Indukan',
  PEJANTAN: 'Pejantan',
  ANAKAN: 'Anakan',
  DARA: 'Dara',
  JANTAN_MUDA: 'Jantan Muda',
}

const KATEGORI_VARIANT: Record<string, 'emerald' | 'ink' | 'ochre' | 'moss' | 'amber'> = {
  INDUKAN: 'moss',
  PEJANTAN: 'ink',
  ANAKAN: 'ochre',
  DARA: 'emerald',
  JANTAN_MUDA: 'amber',
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'AKTIF') return <Badge variant="emerald">Aktif</Badge>
  if (status === 'MATI') return <Badge variant="rose">Mati</Badge>
  return <Badge>Terjual</Badge>
}

export function HewanClient({
  hewanList,
  isSuperAdmin,
}: {
  hewanList: HewanWithRelations[]
  isSuperAdmin: boolean
}) {
  const [q, setQ] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [kat, setKat] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [kelaminFilter, setKelaminFilter] = useState<string>('ALL')
  const [farmFilter, setFarmFilter] = useState<string>('ALL')
  const router = useRouter()

  const filtered = useMemo(() => {
    return hewanList.filter((h) => {
      if (kat !== 'ALL' && h.kategori !== kat) return false
      if (statusFilter !== 'ALL' && h.status !== statusFilter) return false
      if (kelaminFilter !== 'ALL' && h.kelamin !== kelaminFilter) return false
      if (farmFilter !== 'ALL' && h.farmId !== farmFilter) return false
      if (q && !(`${h.tag} ${h.nama || ''}`.toLowerCase().includes(q.toLowerCase()))) return false
      return true
    })
  }, [q, kat, statusFilter, kelaminFilter, farmFilter, hewanList])

  const activeFilterCount = (kat !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0) + (kelaminFilter !== 'ALL' ? 1 : 0) + (farmFilter !== 'ALL' ? 1 : 0)

  const cats = ['ALL', 'INDUKAN', 'PEJANTAN', 'ANAKAN', 'DARA', 'JANTAN_MUDA']
  const statuses = ['ALL', 'AKTIF', 'MATI', 'TERJUAL']
  const kelamins = ['ALL', 'JANTAN', 'BETINA']

  // Derive unique farms for Super Admin filter
  const uniqueFarms = useMemo(() => {
    if (!isSuperAdmin) return []
    const farmMap = new Map<string, string>()
    hewanList.forEach(h => farmMap.set(h.farmId, h.farm.nama))
    return Array.from(farmMap.entries()).map(([id, nama]) => ({ id, nama }))
  }, [hewanList, isSuperAdmin])

  return (
    <div>
      <KostaPageHeader
        title="Daftar Hewan"
        description={`${filtered.length} ekor ditampilkan. Klik baris untuk membuka profil lengkap.`}
        action={
          <div className="flex gap-2">
            <KostaButton variant="outline" onClick={() => setIsFilterOpen(true)}>
              <Filter size={13} /> 
              Filter {activeFilterCount > 0 && <span className="ml-1 w-4 h-4 rounded-full bg-[rgba(13,20,15,0.1)] flex items-center justify-center text-[10px]">{activeFilterCount}</span>}
            </KostaButton>
            <Link href="/hewan/tambah">
              <KostaButton>
                <Plus size={13} /> Tambah Hewan
              </KostaButton>
            </Link>
          </div>
        }
      />

      {/* Search Bar only */}
      <KostaCard className="p-4 mb-5 flex items-center">
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-full w-full"
          style={{ background: 'rgba(13,20,15,0.04)', border: `1px solid ${palette.border}` }}
        >
          <Search size={14} style={{ opacity: 0.5 }} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Cari tag (KST-…), atau nama..."
            className="bg-transparent outline-none flex-1"
            style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}
          />
        </div>
      </KostaCard>

      {/* Table */}
      <KostaCard className="overflow-hidden">
        <div
          className={`grid px-5 py-3 ${isSuperAdmin ? 'grid-cols-[1.6fr_0.8fr_0.6fr_0.8fr_0.6fr_0.8fr_0.6fr]' : 'grid-cols-[1.6fr_0.8fr_0.6fr_0.8fr_0.6fr_0.6fr]'}`}
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
          <div>KELAMIN</div>
          <div>TGL LAHIR</div>
          <div>BERAT</div>
          {isSuperAdmin && <div>FARM</div>}
          <div>STATUS</div>
        </div>
        <div>
          {filtered.length === 0 && (
            <KostaEmptyState title="Tidak ada hewan." hint="Coba ubah filter atau tambah hewan baru." />
          )}
          {filtered.slice(0, 50).map((h, i) => (
            <motion.button
              key={h.id}
              onClick={() => router.push(`/hewan/${h.id}`)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.4), duration: 0.3 }}
              className={`cursor-pointer grid px-5 py-3 w-full text-left items-center hover:bg-[rgba(13,20,15,0.025)] transition-colors ${isSuperAdmin ? 'grid-cols-[1.6fr_0.8fr_0.6fr_0.8fr_0.6fr_0.8fr_0.6fr]' : 'grid-cols-[1.6fr_0.8fr_0.6fr_0.8fr_0.6fr_0.6fr]'}`}
              style={{ borderBottom: `1px solid ${palette.border}` }}
            >
              <div className="flex items-center gap-3 min-w-0">
                {h.fotoUrl ? (
                  <div className="w-9 h-9 rounded-full overflow-hidden shrink-0" style={{ border: `1px solid ${palette.border}` }}>
                    <img 
                      src={h.fotoUrl} 
                      alt={h.nama || h.tag} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(63,91,58,0.12)', color: palette.moss, fontFamily: "'Fraunces',serif", fontSize: 14, border: `1px solid rgba(63,91,58,0.15)` }}
                  >
                    {(h.nama || h.tag).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5 }}>{h.nama || 'Tanpa Nama'}</div>
                  <div className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>
                    {h.tag}
                  </div>
                </div>
              </div>
              <div>
                <Badge variant={KATEGORI_VARIANT[h.kategori] ?? 'default'}>
                  {KATEGORI_LABEL[h.kategori] ?? h.kategori}
                </Badge>
              </div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>
                {h.kelamin === 'BETINA' ? '♀ Betina' : '♂ Jantan'}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>
                {new Date(h.tanggalLahir).toLocaleDateString('id-ID')}
              </div>
              <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15 }}>
                {h.berat ?? '—'}
                <span className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}> kg</span>
              </div>
              {isSuperAdmin && (
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>
                  {h.farm.nama.replace('Farm ', '')}
                </div>
              )}
              <div>
                <StatusBadge status={h.status} />
              </div>
            </motion.button>
          ))}
        </div>
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

                    {/* Status */}
                    <div>
                      <KostaSectionLabel className="mb-3">STATUS</KostaSectionLabel>
                      <div className="flex flex-wrap gap-2">
                        {statuses.map((s) => (
                          <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className="cursor-pointer px-4 py-2 rounded-full border transition-colors"
                            style={{
                              fontFamily: "'Inter',sans-serif", fontSize: 12,
                              background: statusFilter === s ? palette.ink : 'transparent',
                              color: statusFilter === s ? palette.cream : palette.ink,
                              borderColor: statusFilter === s ? palette.ink : palette.border
                            }}
                          >
                            {s === 'ALL' ? 'Semua' : s === 'AKTIF' ? 'Aktif' : s === 'MATI' ? 'Mati' : 'Terjual'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Kelamin */}
                    <div>
                      <KostaSectionLabel className="mb-3">KELAMIN</KostaSectionLabel>
                      <div className="flex flex-wrap gap-2">
                        {kelamins.map((k) => (
                          <button
                            key={k}
                            onClick={() => setKelaminFilter(k)}
                            className="cursor-pointer px-4 py-2 rounded-full border transition-colors"
                            style={{
                              fontFamily: "'Inter',sans-serif", fontSize: 12,
                              background: kelaminFilter === k ? palette.ink : 'transparent',
                              color: kelaminFilter === k ? palette.cream : palette.ink,
                              borderColor: kelaminFilter === k ? palette.ink : palette.border
                            }}
                          >
                            {k === 'ALL' ? 'Semua' : k === 'JANTAN' ? 'Jantan' : 'Betina'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Farm (Super Admin only) */}
                    {isSuperAdmin && uniqueFarms.length > 0 && (
                      <div>
                        <KostaSectionLabel className="mb-3">FARM</KostaSectionLabel>
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => setFarmFilter('ALL')}
                            className="cursor-pointer px-4 py-2 rounded-full border transition-colors"
                            style={{
                              fontFamily: "'Inter',sans-serif", fontSize: 12,
                              background: farmFilter === 'ALL' ? palette.ink : 'transparent',
                              color: farmFilter === 'ALL' ? palette.cream : palette.ink,
                              borderColor: farmFilter === 'ALL' ? palette.ink : palette.border
                            }}
                          >
                            Semua
                          </button>
                          {uniqueFarms.map((f) => (
                            <button
                              key={f.id}
                              onClick={() => setFarmFilter(f.id)}
                              className="cursor-pointer px-4 py-2 rounded-full border transition-colors"
                              style={{
                                fontFamily: "'Inter',sans-serif", fontSize: 12,
                                background: farmFilter === f.id ? palette.ink : 'transparent',
                                color: farmFilter === f.id ? palette.cream : palette.ink,
                                borderColor: farmFilter === f.id ? palette.ink : palette.border
                              }}
                            >
                              {f.nama.replace('Farm ', '')}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-5" style={{ borderTop: `1px solid ${palette.border}` }}>
                    <div className="flex gap-3">
                      <KostaButton 
                        variant="outline" 
                        className="flex-1 justify-center"
                        onClick={() => {
                          setKat('ALL'); setStatusFilter('ALL'); setKelaminFilter('ALL'); setFarmFilter('ALL')
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
