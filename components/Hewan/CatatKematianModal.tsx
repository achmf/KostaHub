'use client'

import { useState, useTransition, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Skull, AlertTriangle } from 'lucide-react'
import { KostaButton, KostaSectionLabel, palette } from '@/components/KostaUI'
import { catatKematian } from '@/actions/kematian'
import { DatePickerField } from '@/components/ui/DatePickerField'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const PENYEBAB_OPTIONS = [
  { value: 'PENYAKIT', label: 'Penyakit' },
  { value: 'KECELAKAAN', label: 'Kecelakaan' },
  { value: 'USIA_TUA', label: 'Usia Tua' },
  { value: 'MELAHIRKAN', label: 'Komplikasi Melahirkan' },
  { value: 'LAINNYA', label: 'Lainnya' },
]

const triggerCls = 'h-11 w-full rounded-xl bg-white/60 border-border/60 hover:bg-white focus:bg-white transition-all shadow-sm'

interface Props {
  hewanId: string
  hewanNama: string
  hewanTag: string
  onClose: () => void
}

export function CatatKematianModal({ hewanId, hewanNama, hewanTag, onClose }: Props) {
  const [penyebab, setPenyebab] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const handleSubmit = (formData: FormData) => {
    startTransition(async () => {
      setError(null)
      const result = await catatKematian(hewanId, formData)
      if (result && 'error' in result) {
        setError(result.error ?? 'Terjadi kesalahan')
        return
      }
      onClose()
    })
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(13,20,15,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ type: 'spring', stiffness: 400, damping: 35 }}
          className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
          style={{ background: '#fff', border: '1px solid rgba(181,68,59,0.2)' }}
        >
          {/* Header - danger zone */}
          <div className="px-6 pt-6 pb-5" style={{ background: '#B5443B', color: '#fff' }}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>
                  <Skull size={16} />
                </div>
                <div>
                  <KostaSectionLabel style={{ color: 'rgba(255,255,255,0.65)' }}>CATAT KEMATIAN</KostaSectionLabel>
                  <div style={{ fontFamily: "'Fraunces',serif", fontSize: 20, lineHeight: 1.1, marginTop: 4 }}>
                    {hewanNama}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.65, marginTop: 4 }}>
                    {hewanTag}
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Warning note */}
          <div className="mx-6 mt-5 px-4 py-3 rounded-xl flex items-start gap-3"
            style={{ background: 'rgba(181,68,59,0.07)', border: '1px solid rgba(181,68,59,0.18)' }}>
            <AlertTriangle size={14} style={{ color: '#B5443B', marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: '#B5443B', lineHeight: 1.5 }}>
              Tindakan ini dapat dibatalkan jika terjadi kesalahan input.
            </p>
          </div>

          {/* Form */}
          <form action={handleSubmit} className="px-6 py-5 space-y-4">
            {error && (
              <div className="px-4 py-3 rounded-xl"
                style={{ background: 'rgba(181,68,59,0.10)', color: '#B5443B', fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                {error}
              </div>
            )}

            {/* Tanggal Mati */}
            <div>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)', display: 'block', marginBottom: 8 }}>
                TANGGAL KEMATIAN *
              </label>
              <DatePickerField
                name="tanggalMati"
                required
                defaultValue={new Date().toISOString().split('T')[0]}
                disableFuture
                placeholder="Pilih tanggal kematian"
              />
            </div>

            {/* Penyebab */}
            <div>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)', display: 'block', marginBottom: 8 }}>
                PENYEBAB KEMATIAN *
              </label>
              <input type="hidden" name="penyebab" value={penyebab} />
              <Select value={penyebab} onValueChange={(v) => v && setPenyebab(v)}>
                <SelectTrigger className={triggerCls}>
                  <span className="flex-1 text-left line-clamp-1">
                    {PENYEBAB_OPTIONS.find(o => o.value === penyebab)?.label || '— Pilih Penyebab —'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {PENYEBAB_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Catatan */}
            <div>
              <label style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)', display: 'block', marginBottom: 8 }}>
                CATATAN (OPSIONAL)
              </label>
              <textarea
                name="catatan"
                rows={3}
                placeholder="Keterangan tambahan..."
                style={{
                  background: 'rgba(13,20,15,0.03)',
                  border: '1px solid rgba(13,20,15,0.12)',
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                  borderRadius: 12,
                  padding: '10px 14px',
                  width: '100%',
                  outline: 'none',
                  color: palette.ink,
                  resize: 'vertical',
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <KostaButton
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 justify-center"
              >
                Batal
              </KostaButton>
              <KostaButton
                type="submit"
                disabled={isPending || !penyebab}
                className="flex-1 justify-center"
                style={{ background: '#B5443B', color: '#fff', opacity: (!penyebab || isPending) ? 0.6 : 1 }}
              >
                {isPending ? 'Menyimpan…' : 'Catat Kematian'}
              </KostaButton>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  )
}
