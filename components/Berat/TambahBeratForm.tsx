'use client'

import { addBeratBadan } from '@/actions/berat'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useActionState } from 'react'
import { KostaButton, KostaSectionLabel } from '@/components/KostaUI'

const palette = { cream: '#F2EDE0', forest: '#1B2A1F', ink: '#0D140F', border: 'rgba(13,20,15,0.10)' }
const inputStyle: React.CSSProperties = {
  background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`,
  fontFamily: "'Inter',sans-serif", fontSize: 14, borderRadius: 12,
  padding: '12px 16px', width: '100%', outline: 'none', color: palette.ink,
}
const labelStyle: React.CSSProperties = {
  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em',
  color: 'rgba(13,20,15,0.55)', display: 'block', marginBottom: 8,
}

type HewanOption = { id: string; tag: string; nama: string | null }

export function TambahBeratForm({ hewanList, defaultHewanId }: { hewanList: HewanOption[], defaultHewanId?: string }) {
  const [state, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
    return await addBeratBadan(formData)
  }, null)

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/berat" className="flex items-center gap-2 mb-8 opacity-70 hover:opacity-100 transition-opacity"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}>
        <ArrowLeft size={14} /> Kembali ke Berat Badan
      </Link>

      <div className="rounded-3xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
        <div className="px-8 pt-8 pb-6" style={{ background: palette.forest, color: palette.cream }}>
          <KostaSectionLabel>
            <span style={{ color: 'rgba(242,237,224,0.55)' }}>BERAT BADAN · CATAT</span>
          </KostaSectionLabel>
          <h1 className="mt-2" style={{ fontFamily: "'Fraunces',serif", fontSize: 32, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Catat Penimbangan
          </h1>
          <p className="mt-2 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
            Catat hasil penimbangan rutin untuk memantau kurva pertumbuhan.
          </p>
        </div>

        <form action={formAction} className="px-8 py-8 space-y-5">
          {state?.error && (
            <div className="px-4 py-3 rounded-xl" style={{ background: 'rgba(181,68,59,0.1)', color: '#B5443B', fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
              {state.error}
            </div>
          )}
          
          <div>
            <label style={labelStyle}>HEWAN *</label>
            <select required name="hewanId" defaultValue={defaultHewanId} style={inputStyle}>
              <option value="">— Pilih Hewan —</option>
              {hewanList.map((h) => (
                <option key={h.id} value={h.id}>{h.tag}{h.nama ? ` — ${h.nama}` : ''}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label style={labelStyle}>TANGGAL TIMBANG *</label>
              <input required name="tanggal" type="date" defaultValue={new Date().toISOString().split('T')[0]} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>BERAT (KG) *</label>
              <input required name="berat" type="number" step="0.1" min="0.1" placeholder="cth: 32.5" style={inputStyle} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>CATATAN (OPSIONAL)</label>
            <textarea name="catatan" rows={3} style={{...inputStyle, resize: 'none'}} placeholder="Catatan tambahan (kondisi fisik, dll)" />
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/berat">
              <KostaButton variant="outline" type="button">Batal</KostaButton>
            </Link>
            <KostaButton type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan…' : 'Simpan Penimbangan'}
            </KostaButton>
          </div>
        </form>
      </div>
    </div>
  )
}
