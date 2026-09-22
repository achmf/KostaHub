'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, UserPlus, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle,
  User, Mail, Lock, Phone, Shield,
} from 'lucide-react'
import { createUserByAdmin } from '@/actions/admin'

const palette = {
  ink: '#0D140F',
  ochre: '#C7873E',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  border: 'rgba(13,20,15,0.10)',
  muted: 'rgba(13,20,15,0.45)',
  bg: '#F2EDE0',
}

const ROLES = [
  { value: 'SUPER_ADMIN', label: 'Super Admin', color: '#B5443B', desc: 'Akses penuh ke seluruh sistem.' },
  { value: 'OWNER',   label: 'Owner',   color: '#A0692B', desc: 'Pemilik peternakan, memiliki akses penuh ke sistem farm.' },
  { value: 'PETUGAS', label: 'Petugas', color: '#2C5F8A', desc: 'Staf operasional, input data harian.' },
  { value: 'DINAS',   label: 'Dinas',   color: '#1E78A0', desc: 'Akses readonly ke admin dashboard.' },
]

interface Props {
  open: boolean
  onClose: () => void
}

function InputField({
  id, label, icon: Icon, type = 'text', placeholder, required, rightSlot, autoComplete,
}: {
  id: string
  label: string
  icon: React.ElementType
  type?: string
  placeholder: string
  required?: boolean
  rightSlot?: React.ReactNode
  autoComplete?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.12em', color: palette.muted }}
        className="block mb-1.5"
      >
        {label.toUpperCase()}{required && <span style={{ color: palette.ochre }}> *</span>}
      </label>
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
        style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}` }}
      >
        <Icon size={13} style={{ color: palette.muted, flexShrink: 0 }} />
        <input
          id={id}
          name={id}
          type={type}
          placeholder={placeholder}
          required={required}
          autoComplete={autoComplete}
          className="flex-1 min-w-0 bg-transparent outline-none"
          style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}
        />
        {rightSlot}
      </div>
    </div>
  )
}

export default function AdminCreateUserModal({ open, onClose }: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [showPassword, setShowPassword] = useState(false)
  const [selectedRole, setSelectedRole] = useState('OWNER')
  const [result, setResult] = useState<{ error?: string; success?: boolean } | null>(null)

  function handleClose() {
    if (isPending) return
    setResult(null)
    setSelectedRole('OWNER')
    setShowPassword(false)
    formRef.current?.reset()
    onClose()
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setResult(null)
    const data = new FormData(e.currentTarget)
    startTransition(async () => {
      const res = await createUserByAdmin(data)
      setResult(res)
      if (res.success) {
        // Auto-close after 1.5s on success
        setTimeout(handleClose, 1500)
      }
    })
  }

  // Kunci scroll halaman & tutup dengan Escape selama modal terbuka
  // (tanpa deps supaya handleClose yang dipakai selalu versi terbaru)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handleClose()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  })

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[200]"
            style={{ background: 'rgba(13,20,15,0.45)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: 'spring', stiffness: 400, damping: 35 }}
            onClick={(e) => e.target === e.currentTarget && handleClose()}
            className="fixed z-[201] inset-0 flex overflow-y-auto overscroll-contain p-3 sm:p-4"
          >
            <div
              className="m-auto w-full max-w-md rounded-2xl overflow-hidden"
              style={{ background: '#fff', border: `1px solid ${palette.border}`, boxShadow: '0 24px 64px rgba(13,20,15,0.18)' }}
            >
              {/* Header */}
              <div
                className="flex items-center justify-between px-5 py-4"
                style={{ borderBottom: `1px solid ${palette.border}`, background: 'rgba(13,20,15,0.02)' }}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'rgba(63,91,58,0.12)' }}
                  >
                    <UserPlus size={14} style={{ color: palette.moss }} />
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, fontWeight: 600, color: palette.ink }}>
                      Buat User Baru
                    </div>
                    <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 8, letterSpacing: '0.1em', color: palette.muted }}>
                      ADMIN · MANAJEMEN USER
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isPending}
                  aria-label="Tutup"
                  className="cursor-pointer w-10 h-10 -mr-2 sm:mr-0 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center transition-all hover:bg-black/5"
                  style={{ color: palette.muted }}
                >
                  <X size={14} />
                </button>
              </div>

              {/* Form */}
              <form ref={formRef} onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Name + Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-3">
                  <InputField id="name" label="Nama Lengkap" icon={User} placeholder="John Doe" required autoComplete="off" />
                  <InputField id="email" label="Email" icon={Mail} type="email" placeholder="user@email.com" required autoComplete="off" />
                </div>

                {/* Password */}
                <InputField
                  id="password"
                  label="Password"
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 6 karakter"
                  required
                  autoComplete="new-password"
                  rightSlot={
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                      className="cursor-pointer shrink-0 w-10 h-10 -my-2.5 -mr-3 flex items-center justify-center sm:w-auto sm:h-auto sm:m-0"
                      style={{ color: palette.muted }}
                    >
                      {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  }
                />

                {/* Phone */}
                <InputField id="phone" label="No. Telepon" icon={Phone} type="tel" placeholder="08xxxxxxxxxx (opsional)" autoComplete="off" />

                {/* Role */}
                <div>
                  <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.12em', color: palette.muted, marginBottom: 8 }}>
                    ROLE <span style={{ color: palette.ochre }}>*</span>
                  </div>
                  <input type="hidden" name="role" value={selectedRole} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ROLES.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setSelectedRole(r.value)}
                        className="cursor-pointer text-left p-3 rounded-xl transition-all"
                        style={{
                          background: selectedRole === r.value ? `${r.color}12` : 'rgba(13,20,15,0.02)',
                          border: `1px solid ${selectedRole === r.value ? r.color : palette.border}`,
                        }}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Shield size={10} style={{ color: r.color }} />
                          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, fontWeight: 600, color: r.color }}>
                            {r.label}
                          </span>
                        </div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 10, color: palette.muted, lineHeight: 1.4 }}>
                          {r.desc}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback */}
                <AnimatePresence>
                  {result && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                      style={{
                        background: result.success ? 'rgba(63,91,58,0.08)' : 'rgba(181,68,59,0.08)',
                        border: `1px solid ${result.success ? 'rgba(63,91,58,0.25)' : 'rgba(181,68,59,0.25)'}`,
                      }}
                    >
                      {result.success ? (
                        <CheckCircle2 size={13} style={{ color: palette.moss, flexShrink: 0 }} />
                      ) : (
                        <AlertCircle size={13} style={{ color: '#B5443B', flexShrink: 0 }} />
                      )}
                      <span style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 12,
                        color: result.success ? palette.moss : '#B5443B',
                      }}>
                        {result.success ? 'User berhasil dibuat! Menutup...' : result.error}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="cursor-pointer min-h-10 sm:min-h-0 px-4 py-2 rounded-xl transition-all hover:bg-black/5"
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.muted, border: `1px solid ${palette.border}` }}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isPending}
                    className="cursor-pointer flex items-center justify-center gap-1.5 min-h-10 sm:min-h-0 px-5 py-2 rounded-xl transition-all"
                    style={{
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      background: isPending ? 'rgba(27,42,31,0.6)' : palette.forest,
                      color: '#F2EDE0',
                      opacity: isPending ? 0.8 : 1,
                    }}
                  >
                    {isPending ? (
                      <><Loader2 size={13} className="animate-spin" /> Membuat...</>
                    ) : (
                      <><UserPlus size={13} /> Buat User</>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
