'use client'

import { useState } from 'react'
import { registerOwner } from '@/actions/register'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowUpRight, ArrowLeft, User, Building2, MapPin, Phone, Mail, Lock, FileText, ChevronRight } from 'lucide-react'
import { GoatMark } from '@/components/GoatMark'
import Link from 'next/link'
import dynamic from 'next/dynamic'

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false })

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.12)',
  moss: '#3F5B3A',
}

const STEPS = ['Data Diri', 'Data Farm']

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {STEPS.map((label, i) => (
        <div key={label} className="flex items-center gap-2">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full transition-all"
            style={{
              background: i <= current ? palette.forest : 'rgba(13,20,15,0.06)',
              color: i <= current ? palette.cream : 'rgba(13,20,15,0.4)',
              fontFamily: "'Inter',sans-serif",
              fontSize: 12,
              fontWeight: i === current ? 600 : 400,
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center"
              style={{
                background: i <= current ? palette.ochre : 'rgba(13,20,15,0.1)',
                color: i <= current ? palette.ink : 'rgba(13,20,15,0.4)',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {i + 1}
            </span>
            {label}
          </div>
          {i < STEPS.length - 1 && (
            <ChevronRight size={14} style={{ opacity: 0.3 }} />
          )}
        </div>
      ))}
    </div>
  )
}

function InputField({
  id, label, icon: Icon, type = 'text', name, required = false, placeholder, defaultValue,
}: {
  id: string; label: string; icon: React.FC<{ size?: number; style?: React.CSSProperties }>
  type?: string; name: string; required?: boolean; placeholder?: string; defaultValue?: string
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
        {required && <span style={{ color: '#B5443B' }}>*</span>}
      </label>
      <input
        id={id}
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
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
  const [step, setStep] = useState(0)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isPending, setIsPending] = useState(false)
  const [step0Data, setStep0Data] = useState<Record<string, string>>({})
  const [farmLat, setFarmLat] = useState<number | null>(null)
  const [farmLng, setFarmLng] = useState<number | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    if (step === 0) {
      setStep0Data({
        name: formData.get('name') as string ?? '',
        email: formData.get('email') as string ?? '',
        password: formData.get('password') as string ?? '',
        phone: formData.get('phone') as string ?? '',
      })
      setStep(1)
      return
    }

    setIsPending(true)
    setError('')
    Object.entries(step0Data).forEach(([k, v]) => formData.set(k, v))
    const result = await registerOwner(formData)
    setIsPending(false)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: palette.cream }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[440px] rounded-3xl overflow-hidden"
          style={{ background: '#fff', border: `1px solid ${palette.border}` }}
        >
          <div className="px-8 pt-8 pb-10" style={{ background: palette.forest, color: palette.cream }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: palette.ochre }}>
              <GoatMark className="w-8 h-8" />
            </div>
            <h1
              className="tracking-[-0.025em]"
              style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.6rem, 3.5vw, 2rem)', lineHeight: 1.1, fontWeight: 400 }}
            >
              Pendaftaran <span style={{ fontStyle: 'italic', color: palette.ochre }}>berhasil!</span>
            </h1>
            <p className="mt-3 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.5 }}>
              Akun Anda sedang menunggu persetujuan admin pusat. Anda akan mendapat akses setelah farm Anda diverifikasi.
            </p>
          </div>
          <div className="px-8 py-6">
            <Link
              href="/login"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full"
              style={{
                background: palette.ink,
                color: palette.cream,
                fontFamily: "'Inter',sans-serif",
                fontSize: 14,
              }}
            >
              Kembali ke Login
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: palette.cream }}>
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

      <div className="relative z-10 w-full max-w-[520px]">
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
            <div
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.2em', opacity: 0.6 }}
            >
              PENDAFTARAN OWNER FARM
            </div>
            <h1
              className="mt-3 tracking-[-0.025em]"
              style={{
                fontFamily: "'Fraunces',serif",
                fontSize: 'clamp(1.6rem, 3.5vw, 2rem)',
                lineHeight: 1.1,
                fontWeight: 400,
              }}
            >
              Daftarkan <span style={{ fontStyle: 'italic', color: palette.ochre }}>farm Anda.</span>
            </h1>
            <p className="mt-3 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.5 }}>
              Isi data diri dan informasi farm. Setelah diverifikasi admin, Anda bisa langsung mengelola farm.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8">
            <StepIndicator current={step} />

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-4 py-3 rounded-xl mb-5"
                style={{
                  background: 'rgba(181,68,59,0.10)',
                  border: '1px solid rgba(181,68,59,0.25)',
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                  color: '#B5443B',
                }}
              >
                {error}
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <InputField id="reg-name" label="NAMA LENGKAP" icon={User} name="name" required placeholder="John Doe" defaultValue={step0Data.name} />
                  <InputField id="reg-email" label="EMAIL" icon={Mail} type="email" name="email" required placeholder="you@example.com" defaultValue={step0Data.email} />
                  <InputField id="reg-password" label="PASSWORD" icon={Lock} type="password" name="password" required placeholder="Minimal 6 karakter" defaultValue={step0Data.password} />
                  <InputField id="reg-phone" label="NO. TELEPON" icon={Phone} name="phone" placeholder="08xxxxxxxxxx" defaultValue={step0Data.phone} />
                </motion.div>
              )}

              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <InputField id="reg-farm-nama" label="NAMA FARM" icon={Building2} name="farmNama" required placeholder="Farm Kambing Sejahtera" />
                  <InputField id="reg-farm-alamat" label="ALAMAT FARM" icon={MapPin} name="farmAlamat" placeholder="Jl. Peternakan No. 1, Bandung" />
                  <div className="mb-4">
                    <label
                      className="flex items-center gap-1.5 mb-2"
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        letterSpacing: '0.15em',
                        color: 'rgba(13,20,15,0.55)',
                      }}
                    >
                      <MapPin size={12} style={{ opacity: 0.6 }} />
                      LOKASI FARM
                    </label>
                    <div className="mb-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>
                      Geser map dan klik untuk menentukan titik lokasi farm Anda.
                    </div>
                    <LocationPicker 
                      onLocationSelect={(lat, lng) => {
                        setFarmLat(lat)
                        setFarmLng(lng)
                      }} 
                    />
                    <input type="hidden" name="farmLat" value={farmLat || ''} />
                    <input type="hidden" name="farmLng" value={farmLng || ''} />
                  </div>
                  <div>
                    <label
                      htmlFor="reg-farm-deskripsi"
                      className="flex items-center gap-1.5 mb-2"
                      style={{
                        fontFamily: "'JetBrains Mono',monospace",
                        fontSize: 10,
                        letterSpacing: '0.15em',
                        color: 'rgba(13,20,15,0.55)',
                      }}
                    >
                      <FileText size={12} style={{ opacity: 0.6 }} />
                      DESKRIPSI FARM
                    </label>
                    <textarea
                      id="reg-farm-deskripsi"
                      name="farmDeskripsi"
                      rows={3}
                      placeholder="Deskripsi singkat tentang farm Anda..."
                      className="w-full px-4 py-3 rounded-xl transition-all resize-none"
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
                  <InputField id="reg-farm-sertifikat" label="SERTIFIKAT FARM (FILE PDF/GAMBAR)" icon={FileText} name="farmSertifikat" type="file" />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              {step > 0 && (
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex items-center gap-2 px-5 py-3 rounded-full transition-all"
                  style={{
                    background: 'rgba(13,20,15,0.06)',
                    color: palette.ink,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 14,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <ArrowLeft size={14} />
                  Kembali
                </button>
              )}
              <button
                id="register-submit"
                type="submit"
                disabled={isPending}
                className="group flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-full transition-all"
                style={{
                  background: isPending ? 'rgba(13,20,15,0.6)' : palette.ink,
                  color: palette.cream,
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 14,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                {isPending ? 'Mendaftar…' : step === 0 ? 'Lanjut ke Data Farm' : 'Daftar Sekarang'}
                {!isPending && (
                  <span
                    className="w-7 h-7 rounded-full flex items-center justify-center transition-transform group-hover:rotate-45"
                    style={{ background: palette.ochre, color: palette.ink }}
                  >
                    <ArrowUpRight size={14} />
                  </span>
                )}
              </button>
            </div>

            {/* Login link */}
            <div className="mt-5 text-center" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>
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
