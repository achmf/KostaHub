'use client'

import { useState } from 'react'
import { KostaCard, KostaSectionLabel, Badge, KostaDialog, KostaButton, KostaEmptyState, palette } from '@/components/KostaUI'
import { Activity, Calendar, User, Pill, FileText, ImageIcon } from 'lucide-react'
import Image from 'next/image'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'



interface RekamMedis {
  id: string
  tanggal: Date
  diagnosis: string
  obat: string | null
  namaDokter: string | null
  notes: string | null
  fotoUrl: string | null
  tanggalLanjut: Date | null
}

export function RekamMedisHistory({ records }: { records: RekamMedis[] }) {
  const [selectedRecord, setSelectedRecord] = useState<RekamMedis | null>(null)

  const PER_PAGE = 5
  const { paged: currentRecords, page, totalPages, onPrev, onNext } = usePagination(records, PER_PAGE)

  if (records.length === 0) {
    return (
      <KostaCard className="p-6">
        <KostaEmptyState
          title="Belum ada riwayat medis"
          hint="Tambahkan catatan medis pertama untuk hewan ini."
        />
      </KostaCard>
    )
  }

  return (
    <>
      <KostaCard className="p-6">
        <KostaSectionLabel>RIWAYAT REKAM MEDIS</KostaSectionLabel>
        <div className="mt-4 divide-y" style={{ borderColor: palette.border }}>
          {currentRecords.map((m) => (
            <div 
              key={m.id} 
              className="py-4 flex items-start gap-4 cursor-pointer hover:bg-black/[0.02] hover:-translate-y-px rounded-xl px-3 -mx-3 transition-all duration-300 group"
              onClick={() => setSelectedRecord(m)}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-300"
                style={{ background: 'rgba(199,135,62,0.12)', color: palette.ochre }}
              >
                <Activity size={16} />
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500, color: palette.ink }}>{m.diagnosis}</div>
                <div className="opacity-60 mt-1 flex items-center gap-2 flex-wrap" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>
                  <span>{new Date(m.tanggal).toLocaleDateString('id-ID')}</span>
                  <span>·</span>
                  <span>{m.namaDokter ?? 'Tanpa dokter'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">

                {m.tanggalLanjut && (
                  <span className="text-[10px] opacity-50 flex items-center gap-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                    <Calendar size={10} /> {new Date(m.tanggalLanjut).toLocaleDateString('id-ID')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
        {records.length > 0 && (
          <div className="mt-6">
            <PaginationControl
              page={page}
              totalPages={totalPages}
              onPrev={onPrev}
              onNext={onNext}
              totalItems={records.length}
              perPage={PER_PAGE}
            />
          </div>
        )}
      </KostaCard>

      <KostaDialog
        isOpen={!!selectedRecord}
        onClose={() => setSelectedRecord(null)}
        title="Detail Rekam Medis"
        maxWidth="2xl"
      >
        {selectedRecord && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b pb-4" style={{ borderColor: palette.border }}>
              <div>
                <div style={{ fontFamily: "'Fraunces',serif", fontSize: 24, letterSpacing: '-0.02em', color: palette.ink }}>
                  {selectedRecord.diagnosis}
                </div>
                <div className="opacity-60 flex items-center gap-2 mt-1" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>
                  <Calendar size={12} /> {new Date(selectedRecord.tanggal).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
              <div>

              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl" style={{ background: 'rgba(13,20,15,0.03)' }}>
                <div className="flex items-center gap-2 opacity-50 mb-1" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.05em' }}>
                  <User size={12} /> DOKTER
                </div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
                  {selectedRecord.namaDokter || 'Tidak ditentukan'}
                </div>
              </div>
              <div className="p-4 rounded-xl" style={{ background: 'rgba(13,20,15,0.03)' }}>
                <div className="flex items-center gap-2 opacity-50 mb-1" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.05em' }}>
                  <Pill size={12} /> OBAT / TINDAKAN
                </div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
                  {selectedRecord.obat || 'Tidak ada'}
                </div>
              </div>
            </div>

            {selectedRecord.tanggalLanjut && (
              <div className="p-4 rounded-xl border" style={{ borderColor: palette.border, background: 'rgba(199,135,62,0.05)' }}>
                <div className="flex items-center gap-2 text-ochre mb-1" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.05em', color: palette.ochre }}>
                  <Calendar size={12} /> JADWAL TINDAK LANJUT
                </div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
                  {new Date(selectedRecord.tanggalLanjut).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            )}

            {selectedRecord.notes && (
              <div>
                <div className="flex items-center gap-2 opacity-50 mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.05em' }}>
                  <FileText size={12} /> CATATAN MEDIS
                </div>
                <div className="p-4 rounded-xl border leading-relaxed" style={{ borderColor: palette.border, fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
                  {selectedRecord.notes}
                </div>
              </div>
            )}

            {selectedRecord.fotoUrl && (
              <div>
                <div className="flex items-center gap-2 opacity-50 mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.05em' }}>
                  <ImageIcon size={12} /> LAMPIRAN FOTO
                </div>
                <div className="rounded-xl overflow-hidden border" style={{ borderColor: palette.border }}>
                  <Image 
                    src={selectedRecord.fotoUrl} 
                    alt="Foto rekam medis" 
                    width={800} 
                    height={400} 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <KostaButton variant="outline" onClick={() => setSelectedRecord(null)}>Tutup</KostaButton>
            </div>
          </div>
        )}
      </KostaDialog>
    </>
  )
}
