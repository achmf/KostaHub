'use client'

import { tambahCustomNotif } from '@/actions/notifikasi'
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

export default function TambahNotifPage() {
  const [, formAction, isPending] = useActionState(async (_: unknown, formData: FormData) => {
    return await tambahCustomNotif(formData)
  }, null)

  return (
    <div className="max-w-2xl mx-auto">
      <Link href="/notifikasi" className="flex items-center gap-2 mb-8 opacity-70 hover:opacity-100 transition-opacity"
        style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}>
        <ArrowLeft size={14} /> Kembali ke Notifikasi
      </Link>

      <div className="rounded-3xl overflow-hidden" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
        <div className="px-8 pt-8 pb-6" style={{ background: palette.forest, color: palette.cream }}>
          <KostaSectionLabel>
            <span style={{ color: 'rgba(242,237,224,0.55)' }}>NOTIFIKASI · TAMBAH</span>
          </KostaSectionLabel>
          <h1 className="mt-2" style={{ fontFamily: "'Fraunces',serif", fontSize: 32, letterSpacing: '-0.025em', lineHeight: 1.05 }}>
            Tambah Reminder
          </h1>
          <p className="mt-2 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
            Buat pengingat jadwal mandiri untuk operasional farm.
          </p>
        </div>

        <form action={formAction} className="px-8 py-8 space-y-5">
          <div>
            <label style={labelStyle}>JUDUL REMINDER *</label>
            <input required name="title" type="text" placeholder="cth: Cek kondisi kandang B" style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>TANGGAL *</label>
            <input required name="tanggal" type="date" defaultValue={new Date().toISOString().split('T')[0]} style={inputStyle} />
          </div>

          <div>
            <label style={labelStyle}>PESAN TAMBAHAN *</label>
            <textarea required name="message" rows={3} placeholder="Detail pengingat…" style={{ ...inputStyle, resize: 'vertical' }} />
          </div>

          <div className="flex gap-3 pt-2">
            <Link href="/notifikasi">
              <KostaButton variant="outline" type="button">Batal</KostaButton>
            </Link>
            <KostaButton type="submit" disabled={isPending}>
              {isPending ? 'Menyimpan…' : 'Simpan Reminder'}
            </KostaButton>
          </div>
        </form>
      </div>
    </div>
  )
}
