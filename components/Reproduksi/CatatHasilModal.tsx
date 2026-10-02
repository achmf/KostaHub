'use client'

import { useEffect, useState, useTransition } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Baby, HeartCrack } from 'lucide-react'
import { toast } from 'sonner'
import { KostaButton, KostaSectionLabel, palette } from '@/components/KostaUI'
import { DatePickerField } from '@/components/ui/DatePickerField'
import { catatHasilReproduksi } from '@/actions/reproduksi'

type Props = {
  reproduksiId: string
  induk: { tag: string; nama: string | null }
  pejantan: { tag: string; nama: string | null }
  onClose: () => void
}

// Tanggal lokal (WIB), bukan UTC — toISOString() memberi "kemarin" sebelum jam 07:00 WIB
function hariIni() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const labelStyle = {
  fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em',
  color: 'rgba(13,20,15,0.6)', display: 'block', marginBottom: 6,
} as const

const inputStyle = {
  background: 'rgba(13,20,15,0.03)', border: '1px solid rgba(13,20,15,0.14)', borderRadius: 12,
  padding: '10px 12px', width: '100%', outline: 'none', color: palette.ink,
  fontFamily: "'Inter',sans-serif", fontSize: 14,
} as const

export function CatatHasilModal({ reproduksiId, induk, pejantan, onClose }: Props) {
  const [hasil, setHasil] = useState<'LAHIR' | 'GAGAL'>('LAHIR')
  const [jumlah, setJumlah] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && !isPending) onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose, isPending])

  const submit = (formData: FormData) => {
    startTransition(async () => {
      setError(null)
      const res = await catatHasilReproduksi(reproduksiId, formData)
      if ('error' in res) {
        setError(res.error)
        return
      }
      toast.success(res.jumlahAnak > 0
        ? `Kelahiran dicatat — ${res.jumlahAnak} anak terdaftar di Populasi`
        : 'Kehamilan dicatat gagal')
      onClose()
    })
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
        style={{ background: 'rgba(13,20,15,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget && !isPending) onClose() }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="catat-hasil-judul"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="w-full sm:max-w-md max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl shadow-2xl"
          style={{ background: '#fff' }}
        >
          <div className="px-6 pt-6 pb-5 flex items-start justify-between gap-3" style={{ background: palette.forest, color: palette.cream }}>
            <div>
              <KostaSectionLabel style={{ color: 'rgba(242,237,224,0.7)' }}>CATAT HASIL KEHAMILAN</KostaSectionLabel>
              <div id="catat-hasil-judul" style={{ fontFamily: "'Fraunces',serif", fontSize: 20, lineHeight: 1.15, marginTop: 4 }}>
                ♀ {induk.nama || induk.tag} × ♂ {pejantan.nama || pejantan.tag}
              </div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, opacity: 0.75, marginTop: 4 }}>
                {induk.tag} · {pejantan.tag}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              aria-label="Tutup"
              className="cursor-pointer w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/15 transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* onSubmit (bukan action=) supaya React tidak mengosongkan isian saat server mengembalikan error */}
          <form
            onSubmit={(e) => { e.preventDefault(); submit(new FormData(e.currentTarget)) }}
            className="px-6 py-5 space-y-5"
          >
            <input type="hidden" name="hasil" value={hasil} />
            <input type="hidden" name="jumlahAnak" value={jumlah} />

            {error && (
              <div role="alert" className="px-4 py-3 rounded-xl" style={{ background: 'rgba(181,68,59,0.10)', color: '#B5443B', fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Pilihan hasil */}
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Hasil kehamilan">
              {([
                { v: 'LAHIR', label: 'Lahir', icon: <Baby size={15} />, tone: palette.moss },
                { v: 'GAGAL', label: 'Gagal / keguguran', icon: <HeartCrack size={15} />, tone: '#B5443B' },
              ] as const).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  role="radio"
                  aria-checked={hasil === o.v}
                  onClick={() => setHasil(o.v)}
                  className="cursor-pointer h-11 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  style={{
                    border: `1.5px solid ${hasil === o.v ? o.tone : 'rgba(13,20,15,0.14)'}`,
                    background: hasil === o.v ? `${o.tone}14` : 'transparent',
                    color: hasil === o.v ? o.tone : palette.ink,
                    fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500,
                  }}
                >
                  {o.icon} {o.label}
                </button>
              ))}
            </div>

            {hasil === 'LAHIR' ? (
              <>
                <div>
                  <label style={labelStyle}>TANGGAL LAHIR *</label>
                  <DatePickerField name="tanggalLahir" required defaultValue={hariIni()} disableFuture placeholder="Pilih tanggal lahir" />
                </div>

                <div>
                  <span style={labelStyle}>JUMLAH ANAK</span>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setJumlah(n)}
                        aria-pressed={jumlah === n}
                        className="cursor-pointer w-11 h-11 rounded-xl"
                        style={{
                          border: `1.5px solid ${jumlah === n ? palette.moss : 'rgba(13,20,15,0.14)'}`,
                          background: jumlah === n ? 'rgba(63,91,58,0.10)' : 'transparent',
                          fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 500,
                        }}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                </div>

                {Array.from({ length: jumlah }, (_, i) => (
                  <fieldset key={i} className="rounded-2xl p-4 space-y-3" style={{ border: `1px solid ${palette.border}` }}>
                    <legend className="px-1" style={{ ...labelStyle, marginBottom: 0 }}>ANAK {i + 1}</legend>
                    <div>
                      <label htmlFor={`tag_${i}`} style={labelStyle}>TAG *</label>
                      <input id={`tag_${i}`} name={`tag_${i}`} required autoComplete="off" placeholder="mis. KST-20-AN-050" style={inputStyle} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor={`kelamin_${i}`} style={labelStyle}>KELAMIN *</label>
                        <select id={`kelamin_${i}`} name={`kelamin_${i}`} required defaultValue="" style={inputStyle}>
                          <option value="" disabled>Pilih</option>
                          <option value="BETINA">Betina</option>
                          <option value="JANTAN">Jantan</option>
                        </select>
                      </div>
                      <div>
                        <label htmlFor={`berat_${i}`} style={labelStyle}>BERAT LAHIR (KG)</label>
                        <input id={`berat_${i}`} name={`berat_${i}`} inputMode="decimal" autoComplete="off" placeholder="mis. 2,5" style={inputStyle} />
                      </div>
                    </div>
                  </fieldset>
                ))}

                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: 'rgba(13,20,15,0.65)', lineHeight: 1.5 }}>
                  Anak otomatis masuk Populasi sebagai <b>Anakan</b> dengan induk & pejantan ini, sehingga silsilah dan
                  cek kawin sedarah ikut terisi.
                </p>
              </>
            ) : (
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.75)', lineHeight: 1.55 }}>
                Kehamilan akan ditandai <b>gagal / keguguran</b> dan pengingat kelahiran berhenti. Tindakan ini tidak membuat data hewan baru.
              </p>
            )}

            <div className="flex gap-3 pt-1">
              <KostaButton type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1 justify-center">
                Batal
              </KostaButton>
              <KostaButton
                type="submit"
                disabled={isPending}
                className="flex-1 justify-center"
                style={hasil === 'GAGAL' ? { background: '#B5443B', color: '#fff' } : undefined}
              >
                {isPending ? 'Menyimpan…' : hasil === 'LAHIR' ? 'Simpan Kelahiran' : 'Tandai Gagal'}
              </KostaButton>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
