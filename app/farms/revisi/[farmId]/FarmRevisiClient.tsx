'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ArrowUpRight, AlertTriangle, Building2,
  MapPin, FileText, CheckCircle, RefreshCw,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import AddressAutocomplete from '@/components/AddressAutocomplete'
import { reverseGeocode } from '@/lib/geocode'
import { reapplyFarmById } from '@/actions/reapply'
import { GoatMark } from '@/components/GoatMark'

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), { ssr: false })

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.12)',
  danger: '#B5443B',
  dangerBg: 'rgba(181,68,59,0.06)',
  dangerBorder: 'rgba(181,68,59,0.2)',
}

const inputStyle = {
  background: 'rgba(13,20,15,0.03)',
  border: `1px solid ${palette.border}`,
  fontFamily: "'Inter',sans-serif",
  fontSize: 14,
  color: palette.ink,
  outline: 'none',
} as React.CSSProperties

function handleFocusInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = palette.ochre
  e.currentTarget.style.background = '#fff'
}
function handleBlurInput(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
  e.currentTarget.style.borderColor = palette.border
  e.currentTarget.style.background = 'rgba(13,20,15,0.03)'
}

interface Props {
  farmId: string
  initialData: {
    nama: string
    alamat: string
    deskripsi: string
    sertifikatUrl: string | null
    lat: number | null
    lng: number | null
  }
  rejectionReason: string
}

export default function FarmRevisiClient({ farmId, initialData, rejectionReason }: Props) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Controlled address + GPS state — pre-filled dari data farm yang ditolak
  const [farmAlamat, setFarmAlamat] = useState(initialData.alamat)
  const [farmLat, setFarmLat] = useState<number | null>(initialData.lat)
  const [farmLng, setFarmLng] = useState<number | null>(initialData.lng)
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const form = e.currentTarget
    const formData = new FormData(form)

    // Inject farmId dan controlled location state
    formData.set('farmId', farmId)
    formData.set('farmAlamat', farmAlamat)
    if (farmLat !== null) formData.set('farmLat', String(farmLat))
    if (farmLng !== null) formData.set('farmLng', String(farmLng))

    startTransition(async () => {
      const result = await reapplyFarmById(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: palette.cream }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-[480px] rounded-3xl overflow-hidden"
          style={{ background: '#fff', border: `1px solid ${palette.border}` }}
        >
          <div className="px-8 pt-8 pb-10" style={{ background: palette.forest, color: palette.cream }}>
            <div className="flex items-center gap-3 mb-5">
              <GoatMark className="w-7 h-7" />
              <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 18 }}>KostaHub</span>
            </div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
              style={{ background: 'rgba(199,135,62,0.2)', color: palette.ochre, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em' }}
            >
              <CheckCircle size={12} />
              PENGAJUAN ULANG TERKIRIM
            </div>
            <h1
              className="tracking-[-0.025em]"
              style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: 1.1, fontWeight: 400 }}
            >
              Revisi farm berhasil{' '}
              <span style={{ fontStyle: 'italic', color: palette.ochre }}>dikirim.</span>
            </h1>
            <p className="mt-3 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.6 }}>
              Permohonan Anda sudah kami terima dan akan segera ditinjau kembali oleh admin.
            </p>
          </div>
          <div className="px-8 py-6">
            <Link
              href="/farms"
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full"
              style={{ background: palette.ink, color: palette.cream, fontFamily: "'Inter',sans-serif", fontSize: 14 }}
            >
              Kembali ke Daftar Farm
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  // ── Revision form ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: palette.cream }}>
      <div className="relative z-10 w-full max-w-[560px]">
        {/* Brand */}
        <motion.div
          initial={{ y: -16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-2.5 mb-8 justify-center"
        >
          <GoatMark className="w-8 h-8" />
          <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 22, letterSpacing: '-0.02em', color: palette.ink }}>
            KostaHub
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-3xl overflow-hidden"
          style={{ background: '#fff', border: `1px solid ${palette.border}` }}
        >
          {/* Header */}
          <div className="px-8 pt-8 pb-8" style={{ background: palette.forest, color: palette.cream }}>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: 'rgba(181,68,59,0.25)', color: '#FF9B94', fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em' }}
              >
                <AlertTriangle size={11} />
                FARM DITOLAK
              </div>
            </div>
            <h1
              className="tracking-[-0.025em]"
              style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3.5vw, 2rem)', lineHeight: 1.1, fontWeight: 400 }}
            >
              Revisi &amp; ajukan{' '}
              <span style={{ fontStyle: 'italic', color: palette.ochre }}>ulang.</span>
            </h1>
            <p className="mt-3 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.6 }}>
              Perbaiki data farm berdasarkan alasan penolakan di bawah, lalu kirim ulang untuk ditinjau admin.
            </p>
          </div>

          <div className="px-8 py-8 space-y-6">
            {/* Rejection reason banner */}
            <div
              className="p-4 rounded-xl"
              style={{ background: palette.dangerBg, border: `1px solid ${palette.dangerBorder}` }}
            >
              <div
                style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: palette.danger, marginBottom: 6 }}
              >
                ALASAN PENOLAKAN
              </div>
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.danger, lineHeight: 1.6 }}>
                {rejectionReason}
              </p>
            </div>

            {/* Error banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="px-4 py-3 rounded-xl"
                  style={{ background: palette.dangerBg, border: `1px solid ${palette.dangerBorder}`, fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.danger }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form id="farm-revisi-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Nama Farm */}
              <div>
                <label
                  htmlFor="revisi-farm-nama"
                  className="flex items-center gap-1.5 mb-2"
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                >
                  <Building2 size={11} style={{ opacity: 0.6 }} />
                  NAMA FARM <span style={{ color: palette.danger }}>*</span>
                </label>
                <input
                  id="revisi-farm-nama"
                  type="text"
                  name="farmNama"
                  required
                  defaultValue={initialData.nama}
                  placeholder="Farm Kambing Sejahtera"
                  className="w-full px-4 py-3 rounded-xl transition-all"
                  style={inputStyle}
                  onFocus={handleFocusInput}
                  onBlur={handleBlurInput}
                />
              </div>

              {/* Alamat — Autocomplete */}
              <div>
                <label
                  className="flex items-center gap-1.5 mb-2"
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                >
                  <MapPin size={11} style={{ opacity: 0.6 }} />
                  ALAMAT FARM
                </label>
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
                <label
                  className="flex items-center gap-1.5 mb-2"
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                >
                  <MapPin size={11} style={{ opacity: 0.6 }} />
                  LOKASI FARM (GPS)
                </label>
                <p className="mb-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)' }}>
                  Klik peta untuk memperbarui titik lokasi — alamat akan terisi otomatis.
                </p>
                <LocationPicker
                  defaultLat={initialData.lat ?? undefined}
                  defaultLng={initialData.lng ?? undefined}
                  externalPosition={externalMapPos}
                  onLocationSelect={handleMapClick}
                />
              </div>

              {/* Deskripsi */}
              <div>
                <label
                  htmlFor="revisi-farm-deskripsi"
                  className="flex items-center gap-1.5 mb-2"
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                >
                  <FileText size={11} style={{ opacity: 0.6 }} />
                  DESKRIPSI FARM
                </label>
                <textarea
                  id="revisi-farm-deskripsi"
                  name="farmDeskripsi"
                  rows={3}
                  defaultValue={initialData.deskripsi}
                  placeholder="Deskripsi singkat tentang farm Anda…"
                  className="w-full px-4 py-3 rounded-xl transition-all resize-none"
                  style={inputStyle}
                  onFocus={handleFocusInput}
                  onBlur={handleBlurInput}
                />
              </div>

              {/* Sertifikat */}
              <div>
                <label
                  htmlFor="revisi-farm-sertifikat"
                  className="flex items-center gap-1.5 mb-2"
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                >
                  <FileText size={11} style={{ opacity: 0.6 }} />
                  SERTIFIKAT FARM (PDF/GAMBAR)
                </label>
                {initialData.sertifikatUrl && (
                  <p className="mb-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
                    Sertifikat sebelumnya sudah ada. Upload baru untuk mengganti.
                  </p>
                )}
                <input
                  id="revisi-farm-sertifikat"
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
                  className="flex items-center gap-2 px-5 py-3 rounded-full"
                  style={{
                    background: 'rgba(13,20,15,0.06)',
                    color: palette.ink,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 14,
                    border: `1px solid ${palette.border}`,
                  }}
                >
                  <ArrowLeft size={14} />
                  Batal
                </Link>
                <button
                  id="revisi-submit-btn"
                  type="submit"
                  disabled={isPending}
                  className="group flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-full"
                  style={{
                    background: isPending ? 'rgba(13,20,15,0.5)' : palette.ink,
                    color: palette.cream,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 14,
                    cursor: isPending ? 'not-allowed' : 'pointer',
                    transition: 'background 0.2s ease',
                  }}
                >
                  <RefreshCw size={15} />
                  {isPending ? 'Mengirim…' : 'Ajukan Ulang'}
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
          </div>
        </motion.div>
      </div>
    </div>
  )
}
