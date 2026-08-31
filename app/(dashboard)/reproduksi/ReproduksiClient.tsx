'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'
import { KostaCard, Badge, KostaEmptyState, palette } from '@/components/KostaUI'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'



function StatusBadge({ status }: { status: string }) {
  if (status === 'HAMIL') return <Badge variant="amber">Hamil</Badge>
  if (status === 'LAHIR') return <Badge variant="emerald">Lahir</Badge>
  return <Badge variant="rose">Gagal</Badge>
}

const PER_PAGE = 10

export default function ReproduksiClient({ reproduksiList }: { reproduksiList: any[] }) {
  const { paged: currentItems, page, totalPages, onPrev, onNext } = usePagination(reproduksiList, PER_PAGE)

  return (
    <KostaCard className="overflow-hidden">
      <div
        className="px-5 py-3 grid grid-cols-[1.4fr_1.4fr_0.9fr_1fr_0.7fr_0.8fr] gap-3"
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
            className="px-5 py-3.5 grid grid-cols-[1.4fr_1.4fr_0.9fr_1fr_0.7fr_0.8fr] gap-3 items-center hover:bg-[rgba(13,20,15,0.025)]"
            style={{ borderBottom: `1px solid ${palette.border}` }}
          >
            <div>
              <Link href={`/hewan/${r.induk.id}`} className="hover:underline hover:text-moss transition-colors block">
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  {r.induk.nama || 'Tanpa Nama'}
                </div>
                <div className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>
                  {r.induk.tag}
                </div>
              </Link>
            </div>
            <div>
              <Link href={`/hewan/${r.pejantan.id}`} className="hover:underline hover:text-moss transition-colors block">
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                  {r.pejantan.nama || 'Tanpa Nama'}
                </div>
                <div className="opacity-55" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>
                  {r.pejantan.tag}
                </div>
              </Link>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>
              {new Date(r.tanggalKawin).toLocaleDateString('id-ID')}
            </div>
            <div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11.5 }}>
                {new Date(r.estimasiLahir).toLocaleDateString('id-ID')}
              </div>
              {r.status === 'HAMIL' && (
                <div className="opacity-60" style={{ fontFamily: "'Inter',sans-serif", fontSize: 11 }}>
                  {days > 0 ? `${days} hari lagi` : `${Math.abs(days)} hari lewat`}
                </div>
              )}
            </div>
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5 }}>—</div>
            <div>
              <StatusBadge status={r.status} />
            </div>
          </div>
        )
      })}

      {reproduksiList.length > 0 && (
        <div className="p-5 mt-auto">
          <PaginationControl 
            page={page}
            totalPages={totalPages}
            onPrev={onPrev}
            onNext={onNext}
            totalItems={reproduksiList.length}
            perPage={PER_PAGE}
          />
        </div>
      )}
    </KostaCard>
  )
}
