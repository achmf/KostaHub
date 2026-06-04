'use client'

import { editHewan } from '@/actions/hewan'
import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { KostaButton, KostaSectionLabel } from '@/components/KostaUI'
import type { Hewan } from '@prisma/client'

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
              <select required name="kelamin" defaultValue={hewan.kelamin} style={inputStyle}>
                <option value="JANTAN">♂ Jantan</option>
                <option value="BETINA">♀ Betina</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>KATEGORI *</label>
              <select required name="kategori" defaultValue={hewan.kategori} style={inputStyle}>
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
              <input 
                required 
                name="tanggalLahir" 
                type="date" 
                defaultValue={new Date(hewan.tanggalLahir).toISOString().split('T')[0]} 
                style={inputStyle} 
              />
            </div>
            <div>
              <label style={labelStyle}>STATUS *</label>
              <select required name="status" defaultValue={hewan.status} style={inputStyle}>
                <option value="AKTIF">Aktif</option>
                <option value="TERJUAL">Terjual</option>
                <option value="MATI">Mati</option>
              </select>
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
                  <select name="bapakId" defaultValue={hewan.bapakId || ''} style={inputStyle}>
                    <option value="">— Tidak diketahui —</option>
                    {semuaHewan.filter((h) => h.kelamin === 'JANTAN' && h.id !== hewan.id).map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.tag}{h.nama ? ` — ${h.nama}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>INDUK ♀</label>
                  <select name="indukId" defaultValue={hewan.indukId || ''} style={inputStyle}>
                    <option value="">— Tidak diketahui —</option>
                    {semuaHewan.filter((h) => h.kelamin === 'BETINA' && h.id !== hewan.id).map((h) => (
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
