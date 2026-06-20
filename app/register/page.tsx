'use client'

import { useState } from 'react'
import { registerOwner } from '@/actions/register'
import { motion } from 'framer-motion'
import {
  ArrowUpRight, User, Phone, Mail, Lock, ShieldCheck,
} from 'lucide-react'
import { GoatMark } from '@/components/GoatMark'
import Link from 'next/link'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.12)',
  moss: '#3F5B3A',
  danger: '#B5443B',
}

function InputField({
  id, label, icon: Icon, type = 'text', name, required = false, placeholder,
}: {
  id: string
  label: string
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>
  type?: string
  name: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 mb-2"
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10,
          letterSpacing: '0.15em',
          color: 'rgba(13,20,15,0.55)',
        }}
      >
        <Icon size={12} style={{ opacity: 0.6 }} />
        {label}
        {required && <span style={{ color: palette.danger }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl transition-all"
        style={{
          background: 'rgba(13,20,15,0.03)',
          border: `1px solid ${palette.border}`,
          fontFamily: "'Inter',sans-serif",
          fontSize: 14,
          color: palette.ink,
          outline: 'none',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = palette.ochre
          e.currentTarget.style.background = '#fff'
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = palette.border
          e.currentTarget.style.background = 'rgba(13,20,15,0.03)'
        }}
      />
    </div>
  )
}

export default function RegisterPage() {
  const [error, setError]       = useState('')
  const [isPending, setIsPending] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const password        = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok')
      return
    }

    setIsPending(true)
    setError('')

    const result = await registerOwner(formData)
    // Jika ada error, registerOwner return { error } — jika tidak, redirect otomatis
    if (result?.error) {
      setError(result.error)
      setIsPending(false)
    }
    // Jika sukses, next/navigation redirect() sudah handle — tidak perlu setIsPending(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: palette.cream }}>
      {/* Background waves */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.06 }}
      >
        {[...Array(10)].map((_, i) => (
          <path
            key={i}
            d={`M0 ${10 + i * 9} Q 25 ${8 + i * 9 + (i % 2 ? 5 : -3)}, 50 ${10 + i * 9} T 100 ${10 + i * 9}`}
            stroke={palette.moss}
            strokeWidth="0.4"
            fill="none"
          />
        ))}
      </svg>

      <div className="relative z-10 w-full max-w-[480px]">
        {/* Brand */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 mb-8 justify-center"
          style={{ color: palette.ink }}
        >
          <GoatMark className="w-8 h-8" />
          <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 22, letterSpacing: '-0.02em' }}>
            KostaHub
          </span>
        </motion.div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl overflow-hidden"
          style={{ background: '#fff', border: `1px solid ${palette.border}` }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-8" style={{ background: palette.forest, color: palette.cream }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.2em', opacity: 0.6 }}>
              BUAT AKUN OWNER
            </div>
            <h1
              className="mt-3 tracking-[-0.025em]"
              style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.6rem, 3.5vw, 2rem)', lineHeight: 1.1, fontWeight: 400 }}
            >
              Mulai kelola{' '}
              <span style={{ fontStyle: 'italic', color: palette.ochre }}>farm Anda.</span>
            </h1>
            <p className="mt-3 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.5 }}>
              Daftarkan akun, lalu tambahkan farm Anda. Setiap farm akan diverifikasi oleh admin sebelum aktif.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-4">
            {/* Error banner */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(181,68,59,0.10)',
                  border: '1px solid rgba(181,68,59,0.25)',
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                  color: palette.danger,
                }}
              >
                {error}
              </motion.div>
            )}

            <InputField
              id="reg-name"
              label="NAMA LENGKAP"
              icon={User}
              name="name"
              required
              placeholder="John Doe"
            />
            <InputField
              id="reg-email"
              label="EMAIL"
              icon={Mail}
              type="email"
              name="email"
              required
              placeholder="you@example.com"
            />
            <InputField
              id="reg-password"
              label="PASSWORD"
              icon={Lock}
              type="password"
              name="password"
              required
              placeholder="Minimal 6 karakter"
            />
            <InputField
              id="reg-confirm-password"
              label="KONFIRMASI PASSWORD"
              icon={ShieldCheck}
              type="password"
              name="confirmPassword"
              required
              placeholder="Ulangi password Anda"
            />
            <InputField
              id="reg-phone"
              label="NO. TELEPON"
              icon={Phone}
              name="phone"
              placeholder="08xxxxxxxxxx"
            />

            {/* Info box */}
            <div
              className="px-4 py-3 rounded-xl"
              style={{
                background: 'rgba(27,42,31,0.05)',
                border: `1px solid rgba(27,42,31,0.1)`,
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
                color: 'rgba(13,20,15,0.6)',
                lineHeight: 1.6,
              }}
            >
              <span style={{ fontWeight: 500, color: palette.ink }}>Selanjutnya:</span> Setelah akun dibuat, Anda akan diminta mendaftarkan farm Anda. Farm perlu diverifikasi admin sebelum bisa digunakan.
            </div>

            {/* Submit */}
            <button
              id="register-submit"
              type="submit"
              disabled={isPending}
              className="group w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-full transition-all"
              style={{
                background: isPending ? 'rgba(13,20,15,0.6)' : palette.ink,
                color: palette.cream,
                fontFamily: "'Inter',sans-serif",
                fontSize: 14,
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? 'Membuat akun…' : 'Buat Akun'}
              {!isPending && (
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45"
                  style={{ background: palette.ochre, color: palette.ink }}
                >
                  <ArrowUpRight size={14} />
                </span>
              )}
            </button>

            {/* Login link */}
            <div className="text-center" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>
              Sudah punya akun?{' '}
              <Link href="/login" style={{ color: palette.ochre, fontWeight: 500 }}>
                Masuk
              </Link>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
