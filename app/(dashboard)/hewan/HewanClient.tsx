'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Plus, X, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'


import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'
import {
  KostaPageHeader,
  KostaCard,
  Badge,
  KostaButton,
  KostaEmptyState,
  KostaSectionLabel,
  palette,
} from '@/components/KostaUI'
import { SearchBar } from '@/components/Layout/SearchBar'
import { FilterSheet } from '@/components/Layout/FilterSheet'

type HewanWithRelations = {
  id: string
  tag: string
  nama: string | null
  kelamin: string
  kategori: string
  berat: number | null
  fotoUrl: string | null
  farmId: string
  tanggalLahir: Date
  farm: { nama: string }
  kematian: { tanggalMati: Date } | null
  beratHistory?: { id: string; tanggal: Date; berat: number }[]
  _count?: { rekamMedis: number }
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

function StatusBadge({ kematian }: { kematian: { tanggalMati: Date } | null }) {
  if (kematian) return <Badge variant="rose">Mati</Badge>
  return <Badge variant="emerald">Hidup</Badge>
}

export function HewanClient({
  hewanList,
  isSuperAdmin,
}: {
  hewanList: HewanWithRelations[]
  isSuperAdmin: boolean
}) {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const kat = searchParams.get('kategori') || 'ALL'
  const statusFilter = searchParams.get('status') || 'ALL'
  const kelaminFilter = searchParams.get('kelamin') || 'ALL'
  const farmFilter = searchParams.get('farm') || 'ALL'
  const router = useRouter()

  const filtered = useMemo(() => {
    return hewanList.filter((h) => {
      if (kat !== 'ALL' && h.kategori !== kat) return false
      if (statusFilter === 'MATI' && !h.kematian) return false
      if (statusFilter === 'HIDUP' && !!h.kematian) return false
      if (kelaminFilter !== 'ALL' && h.kelamin !== kelaminFilter) return false
      if (farmFilter !== 'ALL' && h.farmId !== farmFilter) return false
      if (q && !(`${h.tag} ${h.nama || ''}`.toLowerCase().includes(q.toLowerCase()))) return false
      return true
    })
  }, [q, kat, statusFilter, kelaminFilter, farmFilter, hewanList])

  const PER_PAGE = 15
  const { paged, page, totalPages, onPrev, onNext } = usePagination(filtered, PER_PAGE)

  const activeFilterCount = (kat !== 'ALL' ? 1 : 0) + (statusFilter !== 'ALL' ? 1 : 0) + (kelaminFilter !== 'ALL' ? 1 : 0) + (farmFilter !== 'ALL' ? 1 : 0)

  const cats = ['ALL', 'INDUKAN', 'PEJANTAN', 'ANAKAN', 'DARA', 'JANTAN_MUDA']
  const statuses = ['ALL', 'HIDUP', 'MATI']
  const kelamins = ['ALL', 'JANTAN', 'BETINA']

  // Derive unique farms for Super Admin filter
  const uniqueFarms = useMemo(() => {
    if (!isSuperAdmin) return []
    const farmMap = new Map<string, string>()
    hewanList.forEach(h => farmMap.set(h.farmId, h.farm.nama))
    return Array.from(farmMap.entries()).map(([id, nama]) => ({ id, nama }))
  }, [hewanList, isSuperAdmin])

  const filterGroups = [
    {
      paramName: 'kategori',
      title: 'Kategori',
      options: [
        { value: 'ALL', label: 'Semua' },
        ...cats.filter(c => c !== 'ALL').map(c => ({ value: c, label: KATEGORI_LABEL[c] ?? c }))
      ]
    },
    {
      paramName: 'status',
      title: 'Status',
      options: [
        { value: 'ALL', label: 'Semua' },
        { value: 'HIDUP', label: 'Hidup' },
        { value: 'MATI', label: 'Mati' }
      ]
    },
    {
      paramName: 'kelamin',
      title: 'Kelamin',
      options: [
        { value: 'ALL', label: 'Semua' },
        { value: 'JANTAN', label: 'Jantan' },
        { value: 'BETINA', label: 'Betina' }
      ]
    }
  ]

  if (isSuperAdmin && uniqueFarms.length > 0) {
    filterGroups.push({
      paramName: 'farm',
      title: 'Farm',
      options: [
        { value: 'ALL', label: 'Semua' },
        ...uniqueFarms.map(f => ({ value: f.id, label: f.nama.replace('Farm ', '') }))
      ]
    })
  }

  return (
    <div>
      <KostaPageHeader
        title="Daftar Hewan"
        description={`${filtered.length} ekor ditampilkan. Klik baris untuk membuka profil lengkap.`}
        action={
          <div className="flex gap-2 w-full sm:w-auto">
            <Link href="/hewan/tambah" className="flex-1 sm:flex-none">
              <KostaButton className="w-full sm:w-auto justify-center">
                <Plus size={13} /> <span>Tambah Hewan</span>
              </KostaButton>
            </Link>
          </div>
        }
      />

      {/* Search & Filter Bar */}
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SearchBar placeholder="Cari tag (KST-…), atau nama..." />
        <FilterSheet filters={filterGroups} />
      </div>

      {/* Mobile: individual separated cards */}
      <div className="flex flex-col gap-2 md:hidden">
        {filtered.length === 0 && (
          <KostaCard className="overflow-hidden">
            <KostaEmptyState title="Tidak ada hewan." hint="Coba ubah filter atau tambah hewan baru." />
          </KostaCard>
        )}
        {paged.map((h, i) => (
          <motion.div
            key={h.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.015, 0.4), duration: 0.3 }}
          >
            <KostaCard className="overflow-hidden">
              <button
                onClick={() => router.push(`/hewan/${h.id}`)}
                className="cursor-pointer w-full text-left flex flex-col px-4 py-3.5 gap-3 active:bg-[rgba(13,20,15,0.04)] transition-colors"
              >
                {/* Row 1: Avatar + Nama + Status */}
                <div className="flex items-center justify-between w-full gap-3 min-w-0">
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
                  <StatusBadge kematian={h.kematian} />
                </div>

                {/* Row 2: Info chips */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={KATEGORI_VARIANT[h.kategori] ?? 'default'}>
                    {KATEGORI_LABEL[h.kategori] ?? h.kategori}
                  </Badge>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }} className="bg-black/5 px-2 py-0.5 rounded">
                    {h.kelamin === 'BETINA' ? '♀ Betina' : '♂ Jantan'}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }} className="bg-black/5 px-2 py-0.5 rounded">
                    {new Date(h.tanggalLahir).toLocaleDateString('id-ID')}
                  </div>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 15 }}>
                    {h.berat ?? '—'}
                    <span className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}> kg</span>
                  </div>
                  {isSuperAdmin && (
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }} className="text-gray-500">
                      <span className="text-xs mr-1 opacity-70">Farm:</span>
                      {h.farm.nama.replace('Farm ', '')}
                    </div>
                  )}
                </div>
              </button>
            </KostaCard>
          </motion.div>
        ))}

        {filtered.length > 0 && (
          <div className="pt-2">
            <PaginationControl
              page={page}
              totalPages={totalPages}
              onPrev={onPrev}
              onNext={onNext}
              totalItems={filtered.length}
              perPage={PER_PAGE}
            />
          </div>
        )}
      </div>

      {/* Desktop: single card with table layout */}
      <KostaCard className="overflow-hidden hidden md:block">
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
          {paged.map((h, i) => (
            <motion.button
              key={h.id}
              onClick={() => router.push(`/hewan/${h.id}`)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.015, 0.4), duration: 0.3 }}
              className={`cursor-pointer w-full text-left grid px-5 py-3 gap-0 items-center transition-colors hover:bg-[rgba(13,20,15,0.025)] ${isSuperAdmin ? 'grid-cols-[1.6fr_0.8fr_0.6fr_0.8fr_0.6fr_0.8fr_0.6fr]' : 'grid-cols-[1.6fr_0.8fr_0.6fr_0.8fr_0.6fr_0.6fr]'}`}
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
                <StatusBadge kematian={h.kematian} />
              </div>
            </motion.button>
          ))}
        </div>

        {filtered.length > 0 && (
          <div className="px-5 pb-5">
            <PaginationControl
              page={page}
              totalPages={totalPages}
              onPrev={onPrev}
              onNext={onNext}
              totalItems={filtered.length}
              perPage={PER_PAGE}
            />
          </div>
        )}
      </KostaCard>
    </div>
  )
}
