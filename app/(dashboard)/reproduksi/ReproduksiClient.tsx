'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { KostaCard, Badge, KostaEmptyState, palette } from '@/components/KostaUI'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'
import { useSearchParams } from 'next/navigation'
import { SearchBar } from '@/components/Layout/SearchBar'
import { FilterSheet } from '@/components/Layout/FilterSheet'



function StatusBadge({ status }: { status: string }) {
  if (status === 'HAMIL') return <Badge variant="amber">Hamil</Badge>
  if (status === 'LAHIR') return <Badge variant="emerald">Lahir</Badge>
  return <Badge variant="rose">Gagal</Badge>
}

const PER_PAGE = 10

export default function ReproduksiClient({ reproduksiList }: { reproduksiList: any[] }) {
  const searchParams = useSearchParams()
  const q = searchParams.get('q')?.toLowerCase() || ''
  const statusFilter = searchParams.get('status') || 'ALL'

  const filteredList = reproduksiList.filter(r => {
    const matchQ = !q || r.induk?.nama?.toLowerCase().includes(q) ||
           r.induk?.tag?.toLowerCase().includes(q) ||
           r.pejantan?.nama?.toLowerCase().includes(q) ||
           r.pejantan?.tag?.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'ALL' || r.status === statusFilter
    return matchQ && matchStatus
  })

  const { paged: currentItems, page, totalPages, onPrev, onNext } = usePagination(filteredList, PER_PAGE)

  return (
    <>
      <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <SearchBar placeholder="Cari tag atau nama induk/pejantan..." />
        <FilterSheet 
          filters={[
            {
              paramName: "status", 
              title: "Status Reproduksi",
              options: [
                { value: 'ALL', label: 'Semua Status' },
                { value: 'HAMIL', label: 'Hamil' },
                { value: 'LAHIR', label: 'Lahir' },
                { value: 'GAGAL', label: 'Gagal' }
              ]
            }
          ]} 
        />
      </div>

      <KostaCard className="overflow-hidden">
        <div
        className="hidden md:grid px-5 py-3 grid-cols-[1.4fr_1.4fr_0.9fr_1fr_0.7fr_0.8fr] gap-3"
        style={{
          background: 'rgba(13,20,15,0.03)',
          borderBottom: `1px solid ${palette.border}`,
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10,
          letterSpacing: '0.12em',
          color: 'rgba(13,20,15,0.55)',
        }}
      >
        <div>INDUK ♀</div>
        <div>PEJANTAN ♂</div>
        <div>TGL KAWIN</div>
        <div>ESTIMASI LAHIR</div>
        <div>FARM</div>
        <div>STATUS</div>
      </div>
      
      {reproduksiList.length === 0 && (
        <KostaEmptyState
          title="Belum ada data reproduksi"
          hint="Catat perkawinan untuk mulai melacak kehamilan dan kelahiran."
        />
      )}
      
      {currentItems.map((r) => {
        const days = Math.ceil(
          (new Date(r.estimasiLahir).getTime() - Date.now()) / 86400000
        )
        return (
          <div
            key={r.id}
            className="px-5 py-4 md:py-3.5 flex flex-col md:grid md:grid-cols-[1.4fr_1.4fr_0.9fr_1fr_0.7fr_0.8fr] gap-4 md:gap-3 items-start md:items-center hover:bg-[rgba(13,20,15,0.025)]"
            style={{ borderBottom: `1px solid ${palette.border}` }}
          >
            {/* Row 1 di Mobile: Induk & Status */}
            <div className="flex w-full md:w-auto justify-between md:justify-start items-center md:items-start gap-2">
              <div>
                <div className="md:hidden text-xs opacity-50 mb-0.5">INDUK ♀</div>
                <Link href={`/hewan/${r.induk.id}`} className="hover:underline hover:text-moss transition-colors block">
                  <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                    {r.induk.nama || 'Tanpa Nama'}
                  </div>
                  <div className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>
                    {r.induk.tag}
                  </div>
                </Link>
              </div>
              <div className="md:hidden">
                <StatusBadge status={r.status} />
              </div>
            </div>
            
            <div className="w-full md:w-auto border-t md:border-none pt-2 md:pt-0" style={{ borderColor: 'rgba(13,20,15,0.05)' }}>
              <div className="md:hidden text-xs opacity-50 mb-0.5">PEJANTAN ♂</div>
              <Link href={`/hewan/${r.pejantan.id}`} className="hover:underline hover:text-moss transition-colors block">
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  {r.pejantan.nama || 'Tanpa Nama'}
                </div>
                <div className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>
                  {r.pejantan.tag}
                </div>
              </Link>
            </div>
            
            <div className="flex flex-row md:contents gap-4 w-full md:w-auto mt-1 md:mt-0">
              <div>
                <div className="md:hidden text-xs opacity-50 mb-0.5">TGL KAWIN</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }} className="bg-black/5 md:bg-transparent px-2 md:px-0 py-0.5 md:py-0 rounded">
                  {new Date(r.tanggalKawin).toLocaleDateString('id-ID')}
                </div>
              </div>
              <div>
                <div className="md:hidden text-xs opacity-50 mb-0.5">EST. LAHIR</div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }} className="bg-black/5 md:bg-transparent px-2 md:px-0 py-0.5 md:py-0 rounded">
                  {new Date(r.estimasiLahir).toLocaleDateString('id-ID')}
                </div>
                {r.status === 'HAMIL' && (
                  <div className="opacity-60 mt-1" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }}>
                    {days > 0 ? `${days} hari lagi` : `${Math.abs(days)} hari lewat`}
                  </div>
                )}
              </div>
            </div>
            
            <div className="hidden md:block" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>—</div>
            <div className="hidden md:block">
              <StatusBadge status={r.status} />
            </div>
          </div>
        )
      })}

      {filteredList.length > 0 && (
        <div className="p-5 mt-auto">
          <PaginationControl 
            page={page}
            totalPages={totalPages}
            onPrev={onPrev}
            onNext={onNext}
            totalItems={filteredList.length}
            perPage={PER_PAGE}
          />
        </div>
      )}
    </KostaCard>
    </>
  )
}
