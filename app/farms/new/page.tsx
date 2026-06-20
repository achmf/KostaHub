'use client'

import { useState } from 'react'
import { createFarmRegistration } from '@/actions/farm'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowUpRight, ArrowLeft, Building2, MapPin, FileText, Clock, CheckCircle,
} from 'lucide-react'
import { GoatMark } from '@/components/GoatMark'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { reverseGeocode } from '@/lib/geocode'

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false })

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.12)',
  moss: '#3F5B3A',
  danger: '#B5443B',
}

function WaveBg() {
  return (
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
  )
}

function FieldLabel({ icon: Icon, label, required }: {
  icon: React.FC<{ size?: number; style?: React.CSSProperties }>
  label: string
  required?: boolean
}) {
  return (
    <label
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
  )
}

const inputStyle = {
  background: 'rgba(13,20,15,0.03)',
  border: `1px solid ${palette.border}`,
  fontFamily: "'Inter',sans-serif",
  fontSize: 14,
  color: palette.ink,
  outline: 'none',
} as React.CSSProperties

function handleFocus(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = palette.ochre
  e.currentTarget.style.background = '#fff'
}
function handleBlur(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = palette.border
  e.currentTarget.style.background = 'rgba(13,20,15,0.03)'
}

export default function NewFarmPage() {
  const [error, setError]           = useState('')
  const [isPending, setIsPending]   = useState(false)
  const [success, setSuccess]       = useState(false)

  // Bidirectional map/address state
  const [farmAlamat, setFarmAlamat] = useState('')
  const [farmLat, setFarmLat]       = useState<number | null>(null)
  const [farmLng, setFarmLng]       = useState<number | null>(null)
  const [externalMapPos, setExternalMapPos] = useState<{ lat: number; lng: number } | null>(null)

  function handleAddressSelect(address: string, lat: number, lng: number) {
    setFarmAlamat(address)
    setFarmLat(lat)
    setFarmLng(lng)
    setExternalMapPos({ lat, lng })
  }

  async function handleMapClick(lat: number, lng: number) {
    setFarmLat(lat)
    setFarmLng(lng)
    const address = await reverseGeocode(lat, lng)
    if (address) setFarmAlamat(address)
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsPending(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    // Inject bidirectional location state
    formData.set('farmAlamat', farmAlamat)
    if (farmLat !== null) formData.set('farmLat', String(farmLat))
    if (farmLng !== null) formData.set('farmLng', String(farmLng))

    const result = await createFarmRegistration(formData)
    setIsPending(false)

    if (result?.error) {
      setError(result.error)
    } else {
      setSuccess(true)
    }
  }

  // ── Success / Pending Approval screen ─────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: palette.cream }}>
        <WaveBg />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-[480px] rounded-3xl overflow-hidden"
          style={{ background: '#fff', border: `1px solid ${palette.border}` }}
        >
          <div className="px-8 pt-8 pb-10" style={{ background: palette.forest, color: palette.cream }}>
            <div className="flex items-center gap-3 mb-5">
              <GoatMark className="w-7 h-7" />
              <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 18 }}>KostaHub</span>
            </div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{
                background: 'rgba(199,135,62,0.2)',
                color: palette.ochre,
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                letterSpacing: '0.15em',
              }}
            >
              <Clock size={12} />
              MENUNGGU VERIFIKASI
            </div>
            <h1
              className="tracking-[-0.025em]"
              style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: 1.1, fontWeight: 400 }}
            >
              Farm Anda sedang{' '}
              <span style={{ fontStyle: 'italic', color: palette.ochre }}>ditinjau.</span>
            </h1>
            <p className="mt-3 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.5 }}>
              Permohonan pendaftaran farm Anda sudah diterima. Admin akan memverifikasi dalam{' '}
              <strong style={{ color: palette.cream }}>1×24 jam</strong>.
            </p>
          </div>

          <div className="px-8 py-7 space-y-3" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
            <div
              className="p-4 rounded-xl"
              style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}` }}
            >
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.4)', marginBottom: 8 }}>
                YANG SEDANG DIPERIKSA
              </div>
              <ul className="space-y-2" style={{ fontSize: 13, color: 'rgba(13,20,15,0.7)' }}>
                {[
                  'Validitas data farm yang didaftarkan',
                  'Kelengkapan informasi lokasi',
                  'Sertifikat farm (jika dilampirkan)',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: palette.ochre }} />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col gap-2 pt-1">
              <Link
                href="/farms"
                className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full"
                style={{ background: palette.ink, color: palette.cream, fontSize: 14 }}
              >
                <CheckCircle size={15} />
                Lihat Semua Farm Saya
              </Link>
              <button
                type="button"
                onClick={() => setSuccess(false)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full cursor-pointer"
                style={{
                  background: 'rgba(13,20,15,0.05)',
                  color: 'rgba(13,20,15,0.6)',
                  fontSize: 13,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <Building2 size={13} />
                Daftarkan Farm Lain
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Farm Registration Form ─────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: palette.cream }}>
      <WaveBg />

      <div className="relative z-10 w-full max-w-[540px]">
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
              PENDAFTARAN FARM
            </div>
            <h1
              className="mt-3 tracking-[-0.025em]"
              style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.6rem, 3.5vw, 2rem)', lineHeight: 1.1, fontWeight: 400 }}
            >
              Daftarkan{' '}
              <span style={{ fontStyle: 'italic', color: palette.ochre }}>farm Anda.</span>
            </h1>
            <p className="mt-3 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.5 }}>
              Isi data farm dengan lengkap. Farm akan aktif setelah diverifikasi oleh admin.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-5">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
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
            </AnimatePresence>

            {/* Nama Farm */}
            <div>
              <FieldLabel icon={Building2} label="NAMA FARM" required />
              <input
                id="farm-nama"
                type="text"
                name="farmNama"
                required
                placeholder="Farm Kambing Sejahtera"
                className="w-full px-4 py-3 rounded-xl transition-all"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Alamat — Autocomplete */}
            <div>
              <FieldLabel icon={MapPin} label="ALAMAT FARM" />
              <AddressAutocomplete
                value={farmAlamat}
                onChange={setFarmAlamat}
                onSelect={handleAddressSelect}
                placeholder="Cari nama jalan, desa, atau kota…"
              />
              <p className="mt-1.5" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.4)' }}>
                Pilih dari saran atau klik peta untuk mengisi otomatis.
              </p>
            </div>

            {/* Lokasi GPS — Bidirectional map */}
            <div>
              <FieldLabel icon={MapPin} label="LOKASI FARM (GPS)" />
              <p className="mb-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>
                Klik peta untuk menentukan titik lokasi — alamat akan terisi otomatis.
              </p>
              <LocationPicker
                externalPosition={externalMapPos}
                onLocationSelect={handleMapClick}
              />
            </div>

            {/* Deskripsi */}
            <div>
              <FieldLabel icon={FileText} label="DESKRIPSI FARM" />
              <textarea
                id="farm-deskripsi"
                name="farmDeskripsi"
                rows={3}
                placeholder="Deskripsi singkat tentang farm Anda…"
                className="w-full px-4 py-3 rounded-xl transition-all resize-none"
                style={inputStyle}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>

            {/* Sertifikat */}
            <div>
              <FieldLabel icon={FileText} label="SERTIFIKAT FARM (PDF/GAMBAR)" />
              <input
                id="farm-sertifikat"
                type="file"
                name="farmSertifikat"
                accept="image/*,.pdf"
                className="w-full px-4 py-3 rounded-xl transition-all"
                style={{ ...inputStyle, fontSize: 13 }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 pt-2">
              <Link
                href="/farms"
                className="flex items-center gap-2 px-5 py-3 rounded-full transition-opacity hover:opacity-70"
                style={{
                  background: 'rgba(13,20,15,0.06)',
                  color: palette.ink,
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 14,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <ArrowLeft size={14} />
                Nanti saja
              </Link>
              <button
                id="new-farm-submit"
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
                {isPending ? 'Mendaftarkan…' : 'Daftar Farm'}
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
          </form>
        </motion.div>
      </div>
    </div>
  )
}
