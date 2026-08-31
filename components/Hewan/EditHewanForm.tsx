'use client'

import { editHewan } from '@/actions/hewan'
import { useActionState, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { KostaButton, KostaSectionLabel, palette } from '@/components/KostaUI'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { HewanSelector } from '@/components/ui/HewanSelector'
import type { Hewan } from '@prisma/client'
import { DatePickerField } from '@/components/ui/DatePickerField'



const inputStyle: React.CSSProperties = {
  background: 'rgba(13,20,15,0.03)',
  border: `1px solid ${palette.border}`,
  fontFamily: "'Inter',sans-serif",
  fontSize: 14,
  borderRadius: 12,
  padding: '12px 16px',
  width: '100%',
  outline: 'none',
  color: palette.ink,
}

const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono',monospace",
  fontSize: 10,
  letterSpacing: '0.15em',
  color: 'rgba(13,20,15,0.55)',
  display: 'block',
  marginBottom: 8,
}

const triggerCls = 'h-11 w-full rounded-xl bg-white/60 border-border/60 hover:bg-white focus:bg-white transition-all shadow-sm'

export default function EditHewanForm({
  hewan,
  semuaHewan = [],
}: {
  hewan: Hewan
  semuaHewan?: { id: string; tag: string; nama: string | null; kelamin: string }[]
}) {
  const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
    return await editHewan(hewan.id, formData)
  }, null)

  const [kelamin, setKelamin] = useState(hewan.kelamin)
  const [kategori, setKategori] = useState(hewan.kategori)
  const [status, setStatus] = useState(hewan.status)
  const [bapakId, setBapakId] = useState(hewan.bapakId || '')
  const [indukId, setIndukId] = useState(hewan.indukId || '')

  const KELAMIN_LABELS: Record<string, string> = { JANTAN: '♂ Jantan', BETINA: '♀ Betina' }
  const KATEGORI_LABELS: Record<string, string> = { ANAKAN: 'Anakan', DARA: 'Dara', JANTAN_MUDA: 'Jantan Muda', INDUKAN: 'Indukan', PEJANTAN: 'Pejantan' }
  const STATUS_LABELS: Record<string, string> = { AKTIF: 'Aktif', TERJUAL: 'Terjual', MATI: 'Mati' }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back nav */}
      <Link
        href={`/hewan/${hewan.id}`}
        className="flex items-center gap-2 mb-8 opacity-70 hover:opacity-100 transition-opacity"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}
      >
        <ArrowLeft size={14} /> Kembali ke Detail
      </Link>

      <div className="rounded-3xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ background: palette.forest, color: palette.cream }}>
          <KostaSectionLabel>
            <span style={{ color: 'rgba(242,237,224,0.55)' }}>POPULASI · EDIT</span>
          </KostaSectionLabel>
          <h1
            className="mt-2"
            style={{ fontFamily: "'Fraunces',serif", fontSize: 32, letterSpacing: '-0.025em', lineHeight: 1.05 }}
          >
            Edit Data Hewan
          </h1>
          <p className="mt-2 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
            Ubah data kambing yang sudah terdaftar.
          </p>
        </div>

        {/* Form body */}
        <form action={formAction} className="px-8 py-8 space-y-5">
          {state?.error && (
            <div
              className="px-4 py-3 rounded-xl"
              style={{ background: 'rgba(181,68,59,0.10)', color: '#B5443B', fontFamily: "'Inter',sans-serif", fontSize: 13 }}
            >
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>TAG / ID UNIK *</label>
              <input required name="tag" defaultValue={hewan.tag} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>NAMA (OPSIONAL)</label>
              <input name="nama" defaultValue={hewan.nama || ''} style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>JENIS KELAMIN *</label>
              <input type="hidden" name="kelamin" value={kelamin} />
              <Select value={kelamin} onValueChange={(v) => v && setKelamin(v as any)}>
                <SelectTrigger className={triggerCls}>
                  <span className="flex-1 text-left line-clamp-1">{KELAMIN_LABELS[kelamin] || '— Pilih Kelamin —'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="JANTAN">♂ Jantan</SelectItem>
                  <SelectItem value="BETINA">♀ Betina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label style={labelStyle}>KATEGORI *</label>
              <input type="hidden" name="kategori" value={kategori} />
              <Select value={kategori} onValueChange={(v) => v && setKategori(v as any)}>
                <SelectTrigger className={triggerCls}>
                  <span className="flex-1 text-left line-clamp-1">{KATEGORI_LABELS[kategori] || '— Pilih Kategori —'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANAKAN">Anakan</SelectItem>
                  <SelectItem value="DARA">Dara</SelectItem>
                  <SelectItem value="JANTAN_MUDA">Jantan Muda</SelectItem>
                  <SelectItem value="INDUKAN">Indukan</SelectItem>
                  <SelectItem value="PEJANTAN">Pejantan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>TANGGAL LAHIR *</label>
              <DatePickerField
                name="tanggalLahir"
                required
                defaultValue={new Date(hewan.tanggalLahir).toISOString().split('T')[0]}
                disableFuture
                placeholder="Pilih tanggal lahir"
              />
            </div>
            <div>
              <label style={labelStyle}>STATUS *</label>
              <input type="hidden" name="status" value={status} />
              <Select value={status} onValueChange={(v) => v && setStatus(v as any)}>
                <SelectTrigger className={triggerCls}>
                  <span className="flex-1 text-left line-clamp-1">{STATUS_LABELS[status] || '— Pilih Status —'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AKTIF">Aktif</SelectItem>
                  <SelectItem value="TERJUAL">Terjual</SelectItem>
                  <SelectItem value="MATI">Mati</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ASAL USUL / Silsilah */}
          {semuaHewan.length > 0 && (
            <div
              className="space-y-4 pt-2 pb-1"
              style={{ borderTop: `1px solid ${palette.border}` }}
            >
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.4)', paddingTop: 12 }}>
                ASAL USUL (OPSIONAL)
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label style={labelStyle}>JANTAN ♂</label>
                  <HewanSelector
                    name="bapakId"
                    value={bapakId}
                    onChange={(v) => setBapakId(v)}
                    hewanList={[{id: '', tag: '— Tidak diketahui —', nama: null}, ...semuaHewan.filter((h) => h.kelamin === 'JANTAN' && h.id !== hewan.id)]}
                    placeholder="— Tidak diketahui —"
                  />
                </div>
                <div>
                  <label style={labelStyle}>INDUK ♀</label>
                  <HewanSelector
                    name="indukId"
                    value={indukId}
                    onChange={(v) => setIndukId(v)}
                    hewanList={[{id: '', tag: '— Tidak diketahui —', nama: null}, ...semuaHewan.filter((h) => h.kelamin === 'BETINA' && h.id !== hewan.id)]}
                    placeholder="— Tidak diketahui —"
                  />
                </div>
              </div>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(13,20,15,0.45)', marginTop: -8 }}>
                Data silsilah digunakan untuk deteksi potensi kawin sedarah di fitur reproduksi.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Link href={`/hewan/${hewan.id}`} className="flex-1">
              <KostaButton variant="outline" type="button">
                Batal
              </KostaButton>
            </Link>
            <KostaButton type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan…' : 'Simpan Perubahan'}
            </KostaButton>
          </div>
        </form>
      </div>
    </div>
  )
}
