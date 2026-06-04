'use client'

import { tambahHewan } from '@/actions/hewan'
import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { KostaButton, KostaSectionLabel } from '@/components/KostaUI'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  border: 'rgba(13,20,15,0.10)',
  ochre: '#C7873E',
}

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

interface Props {
  isSuperAdmin: boolean
  farms: { id: string; nama: string }[]
  defaultFarmId: string | null
  semuaHewan?: { id: string; tag: string; nama: string | null; kelamin: string }[]
}

export default function TambahHewanForm({ isSuperAdmin, farms, semuaHewan = [] }: Props) {
  const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
    return await tambahHewan(formData)
  }, null)

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
              <select name="farmId" required style={inputStyle}>
                <option value="">— Pilih Farm —</option>
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>{f.nama}</option>
                ))}
              </select>
            </div>
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
              <select required name="kelamin" style={inputStyle}>
                <option value="JANTAN">♂ Jantan</option>
                <option value="BETINA">♀ Betina</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>KATEGORI *</label>
              <select required name="kategori" style={inputStyle}>
                <option value="ANAKAN">Anakan</option>
                <option value="DARA">Dara</option>
                <option value="JANTAN_MUDA">Jantan Muda</option>
                <option value="INDUKAN">Indukan</option>
                <option value="PEJANTAN">Pejantan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>TANGGAL LAHIR *</label>
              <input required name="tanggalLahir" type="date" style={inputStyle} />
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
                  <select name="bapakId" style={inputStyle}>
                    <option value="">— Tidak diketahui —</option>
                    {semuaHewan.filter((h) => h.kelamin === 'JANTAN').map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.tag}{h.nama ? ` — ${h.nama}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>INDUK ♀</label>
                  <select name="indukId" style={inputStyle}>
                    <option value="">— Tidak diketahui —</option>
                    {semuaHewan.filter((h) => h.kelamin === 'BETINA').map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.tag}{h.nama ? ` — ${h.nama}` : ''}
                      </option>
                    ))}
                  </select>
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
