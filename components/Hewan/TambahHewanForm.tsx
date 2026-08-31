'use client'

import { tambahHewan } from '@/actions/hewan'
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

interface Props {
  isSuperAdmin: boolean
  farms: { id: string; nama: string }[]
  defaultFarmId: string | null
  semuaHewan?: { id: string; tag: string; nama: string | null; kelamin: string }[]
}

export default function TambahHewanForm({ isSuperAdmin, farms, defaultFarmId, semuaHewan = [] }: Props) {
  const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
    return await tambahHewan(formData)
  }, null)

  const [farmId, setFarmId] = useState(defaultFarmId || '')
  const [kelamin, setKelamin] = useState('')
  const [kategori, setKategori] = useState('')
  const [bapakId, setBapakId] = useState('')
  const [indukId, setIndukId] = useState('')

  const KELAMIN_LABELS: Record<string, string> = { JANTAN: '♂ Jantan', BETINA: '♀ Betina' }
  const KATEGORI_LABELS: Record<string, string> = { ANAKAN: 'Anakan', DARA: 'Dara', JANTAN_MUDA: 'Jantan Muda', INDUKAN: 'Indukan', PEJANTAN: 'Pejantan' }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back nav */}
      <Link
        href="/hewan"
        className="flex items-center gap-2 mb-8 opacity-70 hover:opacity-100 transition-opacity"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}
      >
        <ArrowLeft size={14} /> Kembali ke Populasi
      </Link>

      <div className="rounded-3xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
        {/* Header */}
        <div className="px-8 pt-8 pb-6" style={{ background: palette.forest, color: palette.cream }}>
          <KostaSectionLabel>
            <span style={{ color: 'rgba(242,237,224,0.55)' }}>POPULASI · TAMBAH</span>
          </KostaSectionLabel>
          <h1
            className="mt-2"
            style={{ fontFamily: "'Fraunces',serif", fontSize: 32, letterSpacing: '-0.025em', lineHeight: 1.05 }}
          >
            Tambah Data Hewan
          </h1>
          <p className="mt-2 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
            Masukkan data kambing baru ke dalam sistem.
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

          {isSuperAdmin && (
            <div>
              <label style={labelStyle}>FARM *</label>
              <input type="hidden" name="farmId" value={farmId} />
              <Select value={farmId} onValueChange={(v) => v && setFarmId(v)}>
                <SelectTrigger className={triggerCls}>
                  <span className="flex-1 text-left line-clamp-1">{farmId ? farms.find(f => f.id === farmId)?.nama : '— Pilih Farm —'}</span>
                </SelectTrigger>
                <SelectContent>
                  {farms.map((f) => (
                    <SelectItem key={f.id} value={f.id}>{f.nama}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!isSuperAdmin && defaultFarmId && (
            <input type="hidden" name="farmId" value={defaultFarmId} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>TAG / ID UNIK *</label>
              <input required name="tag" placeholder="KBG-001" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>NAMA (OPSIONAL)</label>
              <input name="nama" placeholder="Nama panggilan" style={inputStyle} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>JENIS KELAMIN *</label>
              <input type="hidden" name="kelamin" value={kelamin} />
              {/* Note: we omit required prop on native input if using controlled Select, so handle validation in action, or just add required to a hidden text input if needed.
                  But since action already validates, it's fine. */}
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
                disableFuture
                placeholder="Pilih tanggal lahir"
              />
            </div>
            <div>
              <label style={labelStyle}>BERAT BADAN (KG)</label>
              <input name="berat" type="number" step="0.1" min="0" placeholder="0.0" style={inputStyle} />
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
                    hewanList={[{id: '', tag: '— Tidak diketahui —', nama: null}, ...semuaHewan.filter((h) => h.kelamin === 'JANTAN')]}
                    placeholder="— Tidak diketahui —"
                  />
                </div>
                <div>
                  <label style={labelStyle}>INDUK ♀</label>
                  <HewanSelector
                    name="indukId"
                    value={indukId}
                    onChange={(v) => setIndukId(v)}
                    hewanList={[{id: '', tag: '— Tidak diketahui —', nama: null}, ...semuaHewan.filter((h) => h.kelamin === 'BETINA')]}
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
            <Link href="/hewan" className="flex-1">
              <KostaButton variant="outline" type="button">
                Batal
              </KostaButton>
            </Link>
            <KostaButton type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan…' : 'Simpan Data'}
            </KostaButton>
          </div>
        </form>
      </div>
    </div>
  )
}
