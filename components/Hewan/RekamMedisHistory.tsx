'use client'

import { useState } from 'react'
import { KostaCard, KostaSectionLabel, Badge, KostaDialog, KostaButton } from '@/components/KostaUI'
import { Activity, Calendar, User, Pill, FileText, ImageIcon } from 'lucide-react'
import { EmptyState } from '@/components/ui/EmptyState'
import Image from 'next/image'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  ochre: '#C7873E',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  emerald: '#3F7A4E',
}

interface RekamMedis {
  id: string
  tanggal: Date
  diagnosis: string
  obat: string | null
  namaDokter: string | null
  notes: string | null
  fotoUrl: string | null
  status: string
  tanggalLanjut: Date | null
}

export function RekamMedisHistory({ records }: { records: RekamMedis[] }) {
  const [selectedRecord, setSelectedRecord] = useState<RekamMedis | null>(null)

  if (records.length === 0) {
    return (
      <KostaCard className="p-6">
        <EmptyState
          icon={Activity}
          title="Belum ada riwayat medis"
          description="Tambahkan catatan medis pertama untuk hewan ini."
        />
      </KostaCard>
    )
  }

  return (
    <>
      <KostaCard className="p-6">
        <KostaSectionLabel>RIWAYAT REKAM MEDIS</KostaSectionLabel>
        <div className="mt-4 divide-y" style={{ borderColor: palette.border }}>
          {records.map((m) => (
            <div 
              key={m.id} 
              className="py-3.5 flex items-start gap-3 cursor-pointer hover:bg-black/5 rounded-lg px-2 -mx-2 transition-colors"
              onClick={() => setSelectedRecord(m)}
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(199,135,62,0.12)', color: palette.ochre }}
              >
                <Activity size={13} />
              </div>
              <div className="flex-1 min-w-0">
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5 }}>{m.diagnosis}</div>
                <div className="opacity-55 mt-0.5 flex items-center gap-2 flex-wrap" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10.5 }}>
                  <span>{new Date(m.tanggal).toLocaleDateString('id-ID')}</span>
                  <span>·</span>
                  <span>{m.namaDokter ?? 'Tanpa dokter'}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {m.status === 'SEMBUH' && <Badge variant="emerald">Sembuh</Badge>}
                {m.status === 'RAWAT' && <Badge variant="ochre">Dalam Perawatan</Badge>}
                {m.status === 'PANTAU' && <Badge variant="moss">Pantau</Badge>}
                {m.tanggalLanjut && (
                  <span className="text-[10px] opacity-50 flex items-center gap-1" style={{ fontFamily: "'JetBrains Mono',monospace" }}>
                    <Calendar size={10} /> {new Date(m.tanggalLanjut).toLocaleDateString('id-ID')}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
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
                {selectedRecord.status === 'SEMBUH' && <Badge variant="emerald">Sembuh</Badge>}
                {selectedRecord.status === 'RAWAT' && <Badge variant="ochre">Dalam Perawatan</Badge>}
                {selectedRecord.status === 'PANTAU' && <Badge variant="moss">Pantau</Badge>}
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
