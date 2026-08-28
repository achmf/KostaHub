'use client'

import { useActionState, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, AlertCircle, Loader2, Lock, Eye, EyeOff } from 'lucide-react'
import { changePassword } from '@/actions/profil'
import type { ProfileActionState } from '@/actions/profil'
import { KostaButton, KostaCard, KostaSectionLabel, palette } from '@/components/KostaUI'

const initialState: ProfileActionState = {}

function PasswordInput({
  id,
  name,
  placeholder,
  label,
}: {
  id: string
  name: string
  placeholder: string
  label: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <KostaSectionLabel>{label}</KostaSectionLabel>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          required
          placeholder={placeholder}
          autoComplete={name === 'currentPassword' ? 'current-password' : 'new-password'}
          style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: 14,
            color: palette.ink,
            background: 'rgba(13,20,15,0.025)',
            border: `1px solid ${palette.border}`,
            borderRadius: 10,
            padding: '10px 40px 10px 14px',
            width: '100%',
            outline: 'none',
            transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = palette.ochre
            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(199,135,62,0.12)'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = palette.border
            e.currentTarget.style.boxShadow = 'none'
          }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
          className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: 'rgba(13,20,15,0.4)', transition: 'color 0.15s ease' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = palette.ink)}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(13,20,15,0.4)')}
        >
          {visible ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>
    </div>
  )
}

export function ChangePasswordForm() {
  const [state, formAction, isPending] = useActionState(changePassword, initialState)
  const formRef = useRef<HTMLFormElement>(null)

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
    >
      <KostaCard>
        <div className="px-6 py-5 border-b" style={{ borderColor: palette.border }}>
          <div className="flex items-center gap-2">
            <Lock size={15} style={{ color: palette.moss }} />
            <div style={{ fontFamily: "'Fraunces',serif", fontSize: 17, color: palette.ink }}>
              Ganti Password
            </div>
          </div>
          <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.55)', marginTop: 4 }}>
            Masukkan password saat ini untuk mengubah password baru.
          </div>
        </div>

        <form ref={formRef} action={formAction} className="px-6 py-5 flex flex-col gap-5">
          <PasswordInput
            id="current-password"
            name="currentPassword"
            label="PASSWORD SAAT INI"
            placeholder="Masukkan password lama Anda"
          />

          <PasswordInput
            id="new-password"
            name="newPassword"
            label="PASSWORD BARU"
            placeholder="Minimal 8 karakter"
          />

          <div className="flex flex-col gap-1.5">
            <PasswordInput
              id="confirm-password"
              name="confirmPassword"
              label="KONFIRMASI PASSWORD BARU"
              placeholder="Ulangi password baru"
            />
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: 'rgba(13,20,15,0.45)' }}>
              Password baru minimal 8 karakter dan tidak boleh sama dengan password lama.
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
                role="alert"
              >
                <AlertCircle size={14} style={{ color: '#B5443B' }} />
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
                role="status"
              >
                <CheckCircle size={14} style={{ color: '#3F7A4E' }} />
                <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: '#3F7A4E' }}>
                  {state.success}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <KostaButton type="submit" variant="primary" disabled={isPending} className="self-start">
            {isPending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
            {isPending ? 'Memproses...' : 'Ubah Password'}
          </KostaButton>
        </form>
      </KostaCard>
    </motion.div>
  )
}
