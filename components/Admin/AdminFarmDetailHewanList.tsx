'use client'

import { useState, useMemo } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge, KATEGORI_BADGE_VARIANT } from '@/components/ui/Badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { KostaSectionLabel, palette } from '@/components/KostaUI'
import { Activity, ChevronLeft, ChevronRight, Search, X } from 'lucide-react'

const kategoriLabel: Record<string, string> = {
  INDUKAN: 'Indukan',
  PEJANTAN: 'Pejantan',
  ANAKAN: 'Anakan',
  DARA: 'Dara',
  JANTAN_MUDA: 'Jantan Muda',
}

interface HewanItem {
  id: string
  tag: string
  nama: string | null
  kategori: string
  kelamin: string
  tanggalLahir: Date | string
  berat: number | null
  createdAt: Date | string
  kematian: { tanggalMati: Date | string; penyebab: string } | null
}

interface Props {
  hewan: HewanItem[]
}

const PAGE_SIZE = 20

function hitungUmur(tanggalLahir: Date | string) {
  const lahir = new Date(tanggalLahir)
  const now = new Date()
  const bulan = (now.getFullYear() - lahir.getFullYear()) * 12 + now.getMonth() - lahir.getMonth()
  if (bulan < 12) return `${bulan} bln`
  return `${Math.floor(bulan / 12)} thn`
}

export default function AdminFarmDetailHewanList({ hewan }: Props) {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filterKategori, setFilterKategori] = useState<string>('SEMUA')
  const [filterStatus, setFilterStatus] = useState<string>('HIDUP')

  const filtered = useMemo(() => {
    return hewan.filter(h => {
      const matchSearch = !search
        || h.tag.toLowerCase().includes(search.toLowerCase())
        || (h.nama?.toLowerCase().includes(search.toLowerCase()) ?? false)
      const matchKategori = filterKategori === 'SEMUA' || h.kategori === filterKategori
      const matchStatus = filterStatus === 'SEMUA'
        || (filterStatus === 'HIDUP' ? !h.kematian : !!h.kematian)
      return matchSearch && matchKategori && matchStatus
    })
  }, [hewan, search, filterKategori, filterStatus])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const kategoriOptions = ['SEMUA', ...Array.from(new Set(hewan.map(h => h.kategori))).sort()]

  // Sliding window page numbers (max 5)
  const pageNumbers = Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
    if (totalPages <= 5) return i + 1
    if (page <= 3) return i + 1
    if (page >= totalPages - 2) return totalPages - 4 + i
    return page - 2 + i
  })

  return (
    <div
      className="rounded-2xl p-4 sm:p-6"
      style={{ background: '#fff', border: `1px solid ${palette.border}` }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <KostaSectionLabel style={{ fontSize: 9, letterSpacing: '0.2em', marginBottom: 4 }}>
            POPULASI FARM
          </KostaSectionLabel>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500 }}>
            Daftar Hewan ({filtered.length} dari {hewan.length})
          </div>
        </div>
        <Activity size={16} style={{ color: palette.ochre, opacity: 0.7 }} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        {/* Search — InputGroup pattern from other forms */}
        <div className="relative flex-1 min-w-[180px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'rgba(13,20,15,0.35)' }}
          />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Cari tag atau nama..."
            className="w-full h-9 rounded-lg border border-input bg-transparent text-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            style={{ paddingLeft: 34, paddingRight: search ? 28 : 10 }}
          />
          {search && (
            <button
              type="button"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded opacity-50 hover:opacity-100 transition-opacity"
              onClick={() => { setSearch(''); setPage(1) }}
              aria-label="Hapus pencarian"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Status filter */}
        <Select value={filterStatus} onValueChange={v => { setFilterStatus(v ?? 'SEMUA'); setPage(1) }}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue>
              {filterStatus === 'SEMUA' ? 'Semua Status' : filterStatus === 'HIDUP' ? 'Hidup' : 'Mati'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="SEMUA">Semua Status</SelectItem>
            <SelectItem value="HIDUP">Hidup</SelectItem>
            <SelectItem value="MATI">Mati</SelectItem>
          </SelectContent>
        </Select>

        {/* Kategori filter */}
        <Select value={filterKategori} onValueChange={v => { setFilterKategori(v ?? 'SEMUA'); setPage(1) }}>
          <SelectTrigger size="sm" className="w-[150px]">
            <SelectValue>
              {filterKategori === 'SEMUA' ? 'Semua Kategori' : (kategoriLabel[filterKategori] || filterKategori)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {kategoriOptions.map(k => (
              <SelectItem key={k} value={k}>
                {k === 'SEMUA' ? 'Semua Kategori' : (kategoriLabel[k] || k)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {paged.length === 0 ? (
        <EmptyState
          icon={Activity}
          title={search || filterKategori !== 'SEMUA' || filterStatus !== 'SEMUA'
            ? 'Tidak ada hasil'
            : 'Tidak ada hewan'}
        />
      ) : (
        <div className="space-y-1.5">
          {paged.map((h) => {
            const mati = !!h.kematian
            const kategoriVariant = KATEGORI_BADGE_VARIANT[h.kategori] ?? 'gray'
            return (
              <div
                key={h.id}
                className="flex items-center gap-3 py-2 px-3 rounded-xl"
                style={{ border: `1px solid ${palette.border}`, opacity: mati ? 0.55 : 1 }}
              >
                {/* Gender glyph */}
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center shrink-0"
                  style={{ background: h.kelamin === 'JANTAN' ? 'rgba(181,68,59,0.08)' : 'rgba(44,95,138,0.08)' }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: h.kelamin === 'JANTAN' ? palette.rose : '#2C5F8A',
                      lineHeight: 1,
                    }}
                  >
                    {h.kelamin === 'JANTAN' ? '♂' : '♀'}
                  </span>
                </div>

                {/* Nama + Tag */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 12.5,
                        fontWeight: 500,
                        color: mati ? palette.muted : palette.ink,
                      }}
                    >
                      {h.nama || h.tag}
                    </span>
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        color: palette.muted,
                      }}
                    >
                      #{h.tag}
                    </span>
                    {mati && (
                      <Badge variant="error" shape="tag" size="sm">MATI</Badge>
                    )}
                  </div>
                </div>

                {/* Kategori + Umur + Berat */}
                <div className="shrink-0 flex items-center gap-2 flex-wrap justify-end">
                  <span className="hidden sm:inline-flex">
                    <Badge variant={kategoriVariant} shape="pill" size="sm">
                      {kategoriLabel[h.kategori] || h.kategori}
                    </Badge>
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      color: palette.muted,
                    }}
                  >
                    {hitungUmur(h.tanggalLahir)}
                  </span>
                  {h.berat && (
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 9,
                        color: palette.muted,
                      }}
                    >
                      {h.berat} kg
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div
          className="flex items-center justify-between mt-4 pt-4"
          style={{ borderTop: `1px solid ${palette.border}` }}
        >
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 9,
              color: palette.muted,
            }}
          >
            {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
              aria-label="Halaman sebelumnya"
            >
              <ChevronLeft size={13} />
            </Button>

            {pageNumbers.map(p => (
              <Button
                key={p}
                variant={p === page ? 'secondary' : 'ghost'}
                size="icon-sm"
                onClick={() => setPage(p)}
                aria-label={`Halaman ${p}`}
                aria-current={p === page ? 'page' : undefined}
                style={p === page ? { color: palette.ochre } : { color: palette.muted }}
              >
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>{p}</span>
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon-sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              aria-label="Halaman berikutnya"
            >
              <ChevronRight size={13} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
