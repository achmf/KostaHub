'use client'

import { Badge } from '@/components/KostaUI'
import { ChevronRight, Stethoscope } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import Link from 'next/link'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'

interface RekamMedis {
  id: string
  tanggal: Date
  diagnosis: string
  obat: string | null
  namaDokter: string | null
  notes: string | null
  status: string
  tanggalLanjut: Date | null
}

interface HewanMedis {
  id: string
  tag: string
  nama: string | null
  kelamin: string
  rekamMedis: RekamMedis[]
}

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  ochre: '#C7873E',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  emerald: '#3F7A4E',
}

export function HewanMedisList({ hewans }: { hewans: HewanMedis[] }) {
  const { paged, page, totalPages, onPrev, onNext } = usePagination(hewans, 15)

  if (hewans.length === 0) {
    return (
      <EmptyState
        icon={Stethoscope}
        title="Belum ada data hewan"
        description="Tambahkan hewan terlebih dahulu untuk mulai mencatat rekam medis."
      />
    )
  }

  return (
    <>
      <div className="divide-y" style={{ borderColor: palette.border }}>
        {paged.map((h) => {
          const count = h.rekamMedis.length
          const lastMedis = count > 0 ? h.rekamMedis[0] : null

          return (
            <Link key={h.id} href={`/medis/${h.id}`} className="block transition-colors hover:bg-[rgba(13,20,15,0.015)] group">
              <div className="px-5 py-4 grid grid-cols-[1.5fr_1fr_2fr_1fr_auto] gap-4 items-center">
                <div>
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

                <div>
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}>
                    {count} Catatan
                  </div>
                </div>

                <div>
                  {lastMedis ? (
                    <>
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

                <div>
                  {lastMedis?.status === 'SEMBUH' && <Badge variant="emerald">Sembuh</Badge>}
                  {lastMedis?.status === 'RAWAT' && <Badge variant="ochre">Rawat</Badge>}
                  {lastMedis?.status === 'PANTAU' && <Badge variant="moss">Pantau</Badge>}
                  {!lastMedis && <span className="opacity-30">—</span>}
                </div>

                <div className="flex justify-end pl-2 text-moss/30 group-hover:text-moss/60 transition-colors">
                  <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          )
        })}
      </div>
      <PaginationControl
        page={page}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
        totalItems={hewans.length}
        perPage={15}
      />
    </>
  )
}

export default HewanMedisList
