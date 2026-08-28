'use client'

import { useActionState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2, Save } from 'lucide-react'
import { updateProfile } from '@/actions/profil'
import type { ProfileActionState } from '@/actions/profil'
import { KostaButton, KostaCard, KostaSectionLabel, palette } from '@/components/KostaUI'

const initialState: ProfileActionState = {}

interface EditProfileFormProps {
  name: string
  phone: string | null
}

export function EditProfileForm({ name, phone }: EditProfileFormProps) {
  const [state, formAction, isPending] = useActionState(updateProfile, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  // Auto-clear success message setelah 4 detik
  useEffect(() => {
    if (state?.success) {
      const t = setTimeout(() => {
        /* state akan hilang sendiri di next submit */
      }, 4000)
      return () => clearTimeout(t)
    }
  }, [state?.success])

  const inputStyle: React.CSSProperties = {
    fontFamily: "'Inter',sans-serif",
    fontSize: 14,
    color: palette.ink,
    background: 'rgba(13,20,15,0.025)',
    border: `1px solid ${palette.border}`,
    borderRadius: 10,
    padding: '10px 14px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
    >
      <KostaCard>
        <div className="px-6 py-5 border-b" style={{ borderColor: palette.border }}>
          <div style={{ fontFamily: "'Fraunces',serif", fontSize: 17, color: palette.ink }}>
            Edit Profil
          </div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.55)', marginTop: 4 }}>
            Perbarui nama dan nomor telepon Anda.
          </div>
        </div>

        <form ref={formRef} action={formAction} className="px-6 py-5 flex flex-col gap-5">
          {/* Nama */}
          <div className="flex flex-col gap-1.5">
            <KostaSectionLabel>NAMA LENGKAP</KostaSectionLabel>
            <input
              id="profile-name"
              name="name"
              type="text"
              defaultValue={name}
              required
              minLength={2}
              maxLength={100}
              placeholder="Nama lengkap Anda"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = palette.ochre
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(199,135,62,0.12)`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = palette.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Telepon */}
          <div className="flex flex-col gap-1.5">
            <KostaSectionLabel>NOMOR TELEPON</KostaSectionLabel>
            <input
              id="profile-phone"
              name="phone"
              type="tel"
              defaultValue={phone ?? ''}
              placeholder="Contoh: 08123456789"
              style={inputStyle}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = palette.ochre
                e.currentTarget.style.boxShadow = `0 0 0 3px rgba(199,135,62,0.12)`
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = palette.border
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: 'rgba(13,20,15,0.45)' }}>
              Format: 08xx, +62xx, atau 62xx
            </div>
          </div>

          {/* Feedback */}
          <AnimatePresence mode="wait">
            {state?.error && (
              <motion.div
                key="error"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(181,68,59,0.08)', border: '1px solid rgba(181,68,59,0.2)' }}
              >
                <AlertCircle size={14} style={{ color: '#B5443B', flexShrink: 0 }} />
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#B5443B' }}>
                  {state.error}
                </span>
              </motion.div>
            )}
            {state?.success && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -4, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(63,122,78,0.08)', border: '1px solid rgba(63,122,78,0.2)' }}
              >
                <CheckCircle size={14} style={{ color: '#3F7A4E' }} />
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#3F7A4E' }}>
                  {state.success}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <KostaButton type="submit" variant="primary" disabled={isPending} className="self-start">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {isPending ? 'Menyimpan...' : 'Simpan Perubahan'}
          </KostaButton>
        </form>
      </KostaCard>
    </motion.div>
  )
}
