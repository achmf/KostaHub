'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { login } from '@/actions/auth'
import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { GoatMark } from '@/components/GoatMark'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.12)',
  moss: '#3F5B3A',
}

export default function LoginPage() {
  const router = useRouter()
  const [state, formAction, isPending] = useActionState(login, null)

  // Handle server-side redirect signal (PENDING/REJECTED accounts)
  useEffect(() => {
    if (state && 'redirectTo' in state && state.redirectTo) {
      router.push(state.redirectTo as string)
    }
  }, [state, router])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: palette.cream }}
    >
      {/* Topographic background decoration */}
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

      <div className="relative z-10 w-full max-w-[420px]">
        {/* Brand nav */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 mb-12 justify-center"
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
          {/* Card header — forest band */}
          <div
            className="px-8 pt-8 pb-10"
            style={{ background: palette.forest, color: palette.cream }}
          >
            <div
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                letterSpacing: '0.2em',
                opacity: 0.6,
              }}
            >
              SISTEM MANAJEMEN PETERNAKAN
            </div>
            <h1
              className="mt-3 tracking-[-0.025em]"
              style={{
                fontFamily: "'Fraunces',serif",
                fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
                lineHeight: 1.05,
                fontWeight: 400,
              }}
            >
              Selamat datang<br />
              <span style={{ fontStyle: 'italic', color: palette.ochre }}>kembali.</span>
            </h1>
            <p
              className="mt-3 opacity-70"
              style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.5 }}
            >
              Masuk ke dasbor multi-farm Anda.
            </p>
          </div>

          {/* Form */}
          <form action={formAction} className="px-8 py-8 space-y-5">
            {/* Error */}
            {state?.error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-xl"
                style={{
                  background: 'rgba(181,68,59,0.10)',
                  border: '1px solid rgba(181,68,59,0.25)',
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                  color: '#B5443B',
                }}
              >
                {state.error}
              </motion.div>
            )}

            {/* Email */}
            <div>
              <label
                htmlFor="login-email"
                className="block mb-2"
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  color: 'rgba(13,20,15,0.55)',
                }}
              >
                EMAIL
              </label>
              <input
                id="login-email"
                type="email"
                name="email"
                required
                placeholder="you@example.com"
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

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block mb-2"
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  letterSpacing: '0.15em',
                  color: 'rgba(13,20,15,0.55)',
                }}
              >
                PASSWORD
              </label>
              <input
                id="login-password"
                type="password"
                name="password"
                required
                placeholder="••••••••"
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

            {/* Submit */}
            <button
              id="login-submit"
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
              {isPending ? 'Memproses…' : 'Masuk'}
              {!isPending && (
                <span
                  className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45"
                  style={{ background: palette.ochre, color: palette.ink }}
                >
                  <ArrowUpRight size={14} />
                </span>
              )}
            </button>
          </form>

          {/* Register link */}
          <div className="px-8 pb-6 text-center" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>
            Belum punya akun?{' '}
            <a href="/register" style={{ color: palette.ochre, fontWeight: 500 }}>
              Daftar sebagai Owner
            </a>
          </div>

        </motion.div>


      </div>
    </div>
  )
}
