'use client'

import { Badge, KostaCard, KostaEmptyState, palette } from '@/components/KostaUI'
import { ChevronRight, Stethoscope } from 'lucide-react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'
import { SearchBar } from '@/components/Layout/SearchBar'
import { FilterSheet } from '@/components/Layout/FilterSheet'

interface RekamMedis {
  id: string
  tanggal: Date
  diagnosis: string
  obat: string | null
  namaDokter: string | null
  notes: string | null
  tanggalLanjut: Date | null
}

interface HewanMedis {
  id: string
  tag: string
  nama: string | null
  kelamin: string
  rekamMedis: RekamMedis[]
}



export function HewanMedisList({ hewans }: { hewans: HewanMedis[] }) {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const kelaminFilter = searchParams.get('kelamin') || 'ALL'

  const filteredHewans = hewans.filter(h => {
    const matchKelamin = kelaminFilter === 'ALL' || h.kelamin === kelaminFilter
    if (!matchKelamin) return false
    if (!q) return true
    return `${h.tag} ${h.nama || ''}`.toLowerCase().includes(q.toLowerCase())
  })

  const { paged, page, totalPages, onPrev, onNext } = usePagination(filteredHewans, 15)

  if (hewans.length === 0) {
    return (
      <KostaEmptyState
        title="Belum ada data hewan"
        hint="Tambahkan hewan terlebih dahulu untuk mulai mencatat rekam medis."
      />
    )
  }

  const pagination = (
    <>
      {totalPages > 1 && (
        <div className="pt-2">
          <PaginationControl
            page={page}
            totalPages={totalPages}
            onPrev={onPrev}
            onNext={onNext}
            totalItems={filteredHewans.length}
            perPage={15}
          />
        </div>
      )}
    </>
  )

  return (
    <>
      <div className="mb-5 flex flex-row items-center justify-between gap-3 sm:gap-4">
        <SearchBar placeholder="Cari tag atau nama hewan..." />
        <FilterSheet 
          filters={[
            {
              paramName: 'kelamin',
              title: 'Jenis Kelamin',
              options: [
                { value: 'ALL', label: 'Semua Kelamin' },
                { value: 'JANTAN', label: 'Jantan' },
                { value: 'BETINA', label: 'Betina' }
              ]
            }
          ]} 
        />
      </div>

      {/* ── MOBILE: tiap hewan = KostaCard terpisah (mirip Populasi) ── */}
      <div className="flex flex-col gap-2 md:hidden">
        {paged.map((h) => {
          const count = h.rekamMedis.length
          const lastMedis = count > 0 ? h.rekamMedis[0] : null

          return (
            <KostaCard key={h.id} className="overflow-hidden">
              <Link
                href={`/medis/${h.id}`}
                className="block px-4 py-3.5 active:bg-[rgba(13,20,15,0.04)] transition-colors"
              >
                {/* Row 1: avatar + nama + badge catatan */}
                <div className="flex items-center justify-between gap-3 w-full min-w-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                      style={{
                        background: 'rgba(63,91,58,0.12)',
                        color: palette.moss,
                        fontFamily: "'Fraunces',serif",
                        fontSize: 14,
                        border: `1px solid rgba(63,91,58,0.15)`,
                      }}
                    >
                      {(h.nama || h.tag).slice(0, 1).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5, fontWeight: 500, color: palette.ink }}>
                        {h.nama || 'Tanpa Nama'}{' '}
                        <span className="opacity-50 text-xs font-normal">({h.kelamin})</span>
                      </div>
                      <div className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>
                        {h.tag}
                      </div>
                    </div>
                  </div>
                  <Badge variant={count > 0 ? 'moss' : 'default'}>
                    {count} Catatan
                  </Badge>
                </div>

                {/* Row 2: diagnosis terakhir */}
                <div
                  className="mt-3 pt-2.5 flex items-start justify-between gap-3"
                  style={{ borderTop: `1px solid rgba(13,20,15,0.06)` }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs opacity-50 mb-0.5" style={{ fontFamily: "'JetBrains Mono',monospace", letterSpacing: '0.08em' }}>
                      DIAGNOSIS TERAKHIR
                    </div>
                    {lastMedis ? (
                      <>
                        <div
                          className="truncate"
                          style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}
                        >
                          {lastMedis.diagnosis}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(13,20,15,0.5)', marginTop: 2 }}>
                          {new Date(lastMedis.tanggal).toLocaleDateString('id-ID')}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.4)', fontStyle: 'italic' }}>
                        Belum ada riwayat
                      </div>
                    )}
                  </div>
                  <ChevronRight size={15} style={{ opacity: 0.3, flexShrink: 0, marginTop: 2 }} />
                </div>
              </Link>
            </KostaCard>
          )
        })}
        {pagination}
      </div>

      {/* ── DESKTOP: KostaCard with table header + divide-y rows ── */}
      <div className="hidden md:block">
        <KostaCard className="overflow-hidden">
          <div
            className="grid px-5 py-3 grid-cols-[1.5fr_1fr_2fr_auto] gap-4"
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
            <div>JUMLAH CATATAN</div>
            <div>DIAGNOSIS TERAKHIR</div>
            <div className="w-4"></div>
          </div>
          <div className="divide-y" style={{ borderColor: palette.border }}>
          {paged.map((h) => {
            const count = h.rekamMedis.length
            const lastMedis = count > 0 ? h.rekamMedis[0] : null

            return (
              <Link key={h.id} href={`/medis/${h.id}`} className="block transition-colors hover:bg-[rgba(13,20,15,0.015)] group">
                <div className="px-5 py-4 flex flex-col md:grid md:grid-cols-[1.5fr_1fr_2fr_auto] gap-3 md:gap-4 items-start md:items-center relative">
                  <div className="flex w-full justify-between items-start gap-3 md:w-auto md:block pr-8 md:pr-0">
                    <div className="min-w-0 break-words">
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink }}>
                        {h.nama || 'Tanpa Nama'} <span className="opacity-50 ml-1 text-xs font-normal">({h.kelamin})</span>
                      </div>
                      <div
                        className="opacity-60 flex items-center gap-1.5 mt-0.5"
                        style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}
                      >
                        {h.tag}
                      </div>
                    </div>
                    <div className="md:hidden shrink-0">
                      <Badge variant={count > 0 ? "moss" : "default"}>{count} Catatan</Badge>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}>
                      {count} Catatan
                    </div>
                  </div>

                  <div className="w-full min-w-0 md:w-auto border-t md:border-none pt-2 md:pt-0 mt-1 md:mt-0 pr-8 md:pr-0" style={{ borderColor: 'rgba(13,20,15,0.05)' }}>
                    {lastMedis ? (
                      <>
                        <div className="md:hidden text-xs opacity-50 mb-0.5">DIAGNOSIS TERAKHIR</div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }} className="truncate">
                          {lastMedis.diagnosis}
                        </div>
                        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, color: 'rgba(13,20,15,0.5)' }} className="mt-1">
                          {new Date(lastMedis.tanggal).toLocaleDateString('id-ID')}
                        </div>
                      </>
                    ) : (
                      <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.4)', fontStyle: 'italic' }}>
                        Belum ada riwayat
                      </div>
                    )}
                  </div>

                  <div className="absolute right-5 top-1/2 -translate-y-1/2 md:relative md:right-auto md:top-auto md:translate-y-0 flex justify-end pl-2 text-moss/30 group-hover:text-moss/60 transition-colors">
                    <ChevronRight size={16} />
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
        {totalPages > 1 && (
          <div className="px-5 pb-5">
            <PaginationControl
              page={page}
              totalPages={totalPages}
              onPrev={onPrev}
              onNext={onNext}
              totalItems={filteredHewans.length}
              perPage={15}
            />
          </div>
        )}
        </KostaCard>
      </div>
    </>
  )
}

export default HewanMedisList
