'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GoatMark } from '@/components/GoatMark'
import {
  Clock, AlertTriangle, ArrowUpRight, ArrowLeft,
  Building2, MapPin, FileText, RefreshCw, CheckCircle, Lock, ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { reapplyRegistration } from '@/actions/reapply'
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
  dangerBg: 'rgba(181,68,59,0.08)',
  dangerBorder: 'rgba(181,68,59,0.2)',
}

interface Farm {
  nama: string
  alamat: string
  deskripsi: string
  sertifikatUrl: string | null
  lat: number | null
  lng: number | null
}

interface Props {
  status: 'PENDING' | 'REJECTED'
  rejectionReason: string | null
  farm: Farm | null
}

// ─── Background SVG ────────────────────────────────────────────────────────────
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

// ─── Textarea field ─────────────────────────────────────────────────────────────
function AreaField({
  id, label, name, rows = 3, placeholder, defaultValue,
}: {
  id: string; label: string; name: string; rows?: number; placeholder?: string; defaultValue?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 mb-2"
        style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
      >
        {label}
      </label>
      <textarea
        id={id}
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="w-full px-4 py-3 rounded-xl transition-all resize-none"
        style={{
          background: 'rgba(13,20,15,0.03)',
          border: `1px solid ${palette.border}`,
          fontFamily: "'Inter',sans-serif",
          fontSize: 14,
          color: palette.ink,
          outline: 'none',
        }}
        onFocus={(e) => { e.currentTarget.style.borderColor = palette.ochre; e.currentTarget.style.background = '#fff' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.background = 'rgba(13,20,15,0.03)' }}
      />
    </div>
  )
}

// ─── Input field ─────────────────────────────────────────────────────────────
function InputField({
  id, label, name, placeholder, defaultValue, type = 'text',
}: {
  id: string; label: string; name: string; placeholder?: string; defaultValue?: string; type?: string
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 mb-2"
        style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        name={name}
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
        onFocus={(e) => { e.currentTarget.style.borderColor = palette.ochre; e.currentTarget.style.background = '#fff' }}
        onBlur={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.background = 'rgba(13,20,15,0.03)' }}
      />
    </div>
  )
}

// ─── PENDING view ─────────────────────────────────────────────────────────────
function PendingView() {
  return (
    <motion.div
      key="pending"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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
          MENUNGGU VERIFIKASI FARM
        </div>
        <h1
          className="tracking-[-0.025em]"
          style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)', lineHeight: 1.1, fontWeight: 400 }}
        >
          Farm Anda sedang <span style={{ fontStyle: 'italic', color: palette.ochre }}>ditinjau.</span>
        </h1>
      </div>

      <div className="px-8 py-8">
        <div className="space-y-4" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.7)', lineHeight: 1.7 }}>
          <p>
            Tim admin sedang meninjau data farm Anda. Proses verifikasi biasanya memakan waktu{' '}
            <strong style={{ color: palette.ink }}>1×24 jam</strong>.
          </p>
          <div
            className="p-4 rounded-xl"
            style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}` }}
          >
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.4)', marginBottom: 8 }}>
              YANG SEDANG DIPERIKSA
            </div>
            <ul className="space-y-2" style={{ fontSize: 13 }}>
              {['Validitas data farm yang didaftarkan', 'Kelengkapan informasi lokasi', 'Sertifikat farm (jika dilampirkan)'].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: palette.ochre }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Link
          href="/login"
          className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full cursor-pointer"
          style={{ background: palette.ink, color: palette.cream, fontFamily: "'Inter',sans-serif", fontSize: 14 }}
        >
          Kembali ke Login
          <ArrowUpRight size={14} />
        </Link>
      </div>
    </motion.div>
  )
}

// ─── REJECTED view ────────────────────────────────────────────────────────────
function RejectedView({ rejectionReason, farm }: { rejectionReason: string | null; farm: Farm | null }) {
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Location state — bidirectional
  const [farmAlamat, setFarmAlamat] = useState(farm?.alamat ?? '')
  const [farmLat, setFarmLat] = useState<number | null>(farm?.lat ?? null)
  const [farmLng, setFarmLng] = useState<number | null>(farm?.lng ?? null)
  const [externalMapPosition, setExternalMapPosition] = useState<{ lat: number; lng: number } | null>(null)

  /** Autocomplete suggestion selected → fill address + auto-pin map */
  function handleAddressSelect(address: string, lat: number, lng: number) {
    setFarmAlamat(address)
    setFarmLat(lat)
    setFarmLng(lng)
    setExternalMapPosition({ lat, lng })
  }

  /** Map clicked → update coords + reverse geocode → fill address */
  async function handleMapClick(lat: number, lng: number) {
    setFarmLat(lat)
    setFarmLng(lng)
    const address = await reverseGeocode(lat, lng)
    if (address) setFarmAlamat(address)
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')

    const formData = new FormData(e.currentTarget)

    // Client-side password validation
    const newPassword = formData.get('newPassword') as string
    const confirmPassword = formData.get('confirmPassword') as string
    if (newPassword && newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi tidak cocok')
      return
    }
    if (newPassword && newPassword.length < 6) {
      setError('Password baru minimal 6 karakter')
      return
    }

    // Inject controlled location values
    formData.set('farmAlamat', farmAlamat)
    if (farmLat !== null) formData.set('farmLat', String(farmLat))
    if (farmLng !== null) formData.set('farmLng', String(farmLng))

    startTransition(async () => {
      const result = await reapplyRegistration(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
      }
    })
  }

  if (success) {
    return (
      <motion.div
        key="success"
        initial={{ opacity: 0, scale: 0.96 }}
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
            style={{ background: 'rgba(199,135,62,0.2)', color: palette.ochre, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em' }}
          >
            <CheckCircle size={12} />
            PERMOHONAN DIKIRIM
          </div>
          <h1
            className="tracking-[-0.025em]"
            style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: 1.1, fontWeight: 400 }}
          >
            Pengajuan ulang <span style={{ fontStyle: 'italic', color: palette.ochre }}>berhasil dikirim.</span>
          </h1>
          <p className="mt-3 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.6 }}>
            Permohonan Anda sudah kami terima dan akan segera ditinjau kembali oleh admin.
          </p>
        </div>
        <div className="px-8 py-6">
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.6)', lineHeight: 1.6 }}>
            Halaman ini akan memperlihatkan status terbaru setelah admin memproses permohonan Anda.
          </p>
        </div>
      </motion.div>
    )
  }

  return (
    <motion.div
      key="rejected"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 w-full max-w-[520px] rounded-3xl overflow-hidden"
      style={{ background: '#fff', border: `1px solid ${palette.border}` }}
    >
      {/* Header */}
      <div className="px-8 pt-8 pb-8" style={{ background: palette.forest, color: palette.cream }}>
        <div className="flex items-center gap-3 mb-5">
          <GoatMark className="w-7 h-7" />
          <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 18 }}>KostaHub</span>
        </div>
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
          style={{
            background: 'rgba(181,68,59,0.25)',
            color: '#FF9B94',
            fontFamily: "'JetBrains Mono',monospace",
            fontSize: 10,
            letterSpacing: '0.15em',
          }}
        >
          <AlertTriangle size={12} />
          FARM DITOLAK
        </div>
        <h1
          className="tracking-[-0.025em]"
          style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', lineHeight: 1.1, fontWeight: 400 }}
        >
          Pendaftaran farm Anda <span style={{ fontStyle: 'italic', color: '#FF9B94' }}>belum disetujui.</span>
        </h1>
        <p className="mt-3 opacity-70" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, lineHeight: 1.6 }}>
          Anda dapat merevisi data farm dan mengajukan ulang tanpa perlu mendaftar ulang.
        </p>
      </div>

      <div className="px-8 py-8">
        {/* Rejection reason */}
        {rejectionReason && (
          <div
            className="p-4 rounded-xl mb-6"
            style={{ background: palette.dangerBg, border: `1px solid ${palette.dangerBorder}` }}
          >
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: palette.danger, marginBottom: 6 }}>
              ALASAN PENOLAKAN
            </div>
            <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.danger, lineHeight: 1.6 }}>
              {rejectionReason}
            </p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!showForm ? (
            <motion.div
              key="info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-3"
            >
              <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.65)', lineHeight: 1.7 }}>
                Tinjau alasan di atas, lalu perbaiki data farm Anda dan ajukan kembali untuk ditinjau admin.
              </p>

              <button
                id="reapply-start-btn"
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-2 w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-full cursor-pointer transition-opacity hover:opacity-90"
                style={{ background: palette.ink, color: palette.cream, fontFamily: "'Inter',sans-serif", fontSize: 14 }}
              >
                <RefreshCw size={16} />
                Revisi &amp; Ajukan Ulang
              </button>

              <Link
                href="/login"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-full cursor-pointer transition-opacity hover:opacity-80"
                style={{
                  background: 'rgba(13,20,15,0.05)',
                  color: 'rgba(13,20,15,0.6)',
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                  border: `1px solid ${palette.border}`,
                }}
              >
                <ArrowLeft size={13} />
                Kembali ke Login
              </Link>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10,
                  letterSpacing: '0.18em',
                  color: 'rgba(13,20,15,0.45)',
                  marginBottom: 20,
                }}
              >
                REVISI DATA FARM
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="px-4 py-3 rounded-xl mb-5"
                  style={{ background: palette.dangerBg, border: `1px solid ${palette.dangerBorder}`, fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.danger }}
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Nama Farm */}
                <div>
                  <label
                    htmlFor="ra-farm-nama"
                    className="flex items-center gap-1.5 mb-2"
                    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                  >
                    <Building2 size={12} style={{ opacity: 0.6 }} />
                    NAMA FARM <span style={{ color: palette.danger }}>*</span>
                  </label>
                  <input
                    id="ra-farm-nama"
                    type="text"
                    name="farmNama"
                    required
                    defaultValue={farm?.nama ?? ''}
                    placeholder="Farm Kambing Sejahtera"
                    className="w-full px-4 py-3 rounded-xl transition-all"
                    style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.ink, outline: 'none' }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = palette.ochre; e.currentTarget.style.background = '#fff' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.background = 'rgba(13,20,15,0.03)' }}
                  />
                </div>

                {/* Alamat — Autocomplete */}
                <div>
                  <label
                    className="flex items-center gap-1.5 mb-2"
                    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                  >
                    <MapPin size={12} style={{ opacity: 0.6 }} />
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

                {/* Lokasi — Bidirectional */}
                <div>
                  <label
                    className="flex items-center gap-1.5 mb-2"
                    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                  >
                    <MapPin size={12} style={{ opacity: 0.6 }} />
                    LOKASI FARM
                  </label>
                  <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: 'rgba(13,20,15,0.5)', marginBottom: 8 }}>
                    Klik peta untuk memperbarui titik lokasi — alamat akan terisi otomatis.
                  </p>
                  <LocationPicker
                    defaultLat={farm?.lat ?? undefined}
                    defaultLng={farm?.lng ?? undefined}
                    externalPosition={externalMapPosition}
                    onLocationSelect={handleMapClick}
                  />
                </div>

                {/* Deskripsi */}
                <AreaField
                  id="ra-farm-deskripsi"
                  label="DESKRIPSI FARM"
                  name="farmDeskripsi"
                  placeholder="Deskripsi singkat tentang farm Anda..."
                  defaultValue={farm?.deskripsi ?? ''}
                />

                {/* Sertifikat */}
                <div>
                  <label
                    htmlFor="ra-farm-sertifikat"
                    className="flex items-center gap-1.5 mb-2"
                    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                  >
                    <FileText size={12} style={{ opacity: 0.6 }} />
                    SERTIFIKAT FARM (PDF/GAMBAR)
                  </label>
                  {farm?.sertifikatUrl && (
                    <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.5)', marginBottom: 6 }}>
                      Sertifikat saat ini sudah ada. Upload baru untuk mengganti.
                    </p>
                  )}
                  <input
                    id="ra-farm-sertifikat"
                    type="file"
                    name="farmSertifikat"
                    accept="image/*,.pdf"
                    className="w-full px-4 py-3 rounded-xl transition-all"
                    style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}
                  />
                </div>

                {/* Optional password change */}
                <div
                  style={{
                    borderTop: `1px solid ${palette.border}`,
                    paddingTop: 20,
                    marginTop: 4,
                  }}
                >
                  <div
                    className="flex items-center gap-1.5 mb-1"
                    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.18em', color: 'rgba(13,20,15,0.45)' }}
                  >
                    <Lock size={11} style={{ opacity: 0.6 }} />
                    GANTI PASSWORD <span style={{ opacity: 0.5 }}>(OPSIONAL)</span>
                  </div>
                  <p className="mb-4" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.45)', lineHeight: 1.5 }}>
                    Biarkan kosong jika tidak ingin mengubah password.
                  </p>
                  <div className="space-y-3">
                    {/* New password */}
                    <div>
                      <label
                        htmlFor="ra-new-password"
                        className="flex items-center gap-1.5 mb-2"
                        style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                      >
                        <Lock size={11} style={{ opacity: 0.6 }} />
                        PASSWORD BARU
                      </label>
                      <input
                        id="ra-new-password"
                        type="password"
                        name="newPassword"
                        placeholder="Minimal 6 karakter"
                        className="w-full px-4 py-3 rounded-xl transition-all"
                        style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.ink, outline: 'none' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = palette.ochre; e.currentTarget.style.background = '#fff' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.background = 'rgba(13,20,15,0.03)' }}
                      />
                    </div>
                    {/* Confirm new password */}
                    <div>
                      <label
                        htmlFor="ra-confirm-password"
                        className="flex items-center gap-1.5 mb-2"
                        style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.55)' }}
                      >
                        <ShieldCheck size={11} style={{ opacity: 0.6 }} />
                        KONFIRMASI PASSWORD BARU
                      </label>
                      <input
                        id="ra-confirm-password"
                        type="password"
                        name="confirmPassword"
                        placeholder="Ulangi password baru"
                        className="w-full px-4 py-3 rounded-xl transition-all"
                        style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}`, fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.ink, outline: 'none' }}
                        onFocus={(e) => { e.currentTarget.style.borderColor = palette.ochre; e.currentTarget.style.background = '#fff' }}
                        onBlur={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.background = 'rgba(13,20,15,0.03)' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="cursor-pointer flex items-center gap-2 px-5 py-3 rounded-full transition-opacity hover:opacity-70"
                    style={{ background: 'rgba(13,20,15,0.06)', color: palette.ink, fontFamily: "'Inter',sans-serif", fontSize: 14, border: `1px solid ${palette.border}` }}
                  >
                    <ArrowLeft size={14} />
                    Batal
                  </button>
                  <button
                    id="reapply-submit-btn"
                    type="submit"
                    disabled={isPending}
                    className="group flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-full transition-opacity cursor-pointer"
                    style={{
                      background: isPending ? 'rgba(13,20,15,0.5)' : palette.ink,
                      color: palette.cream,
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 14,
                      cursor: isPending ? 'not-allowed' : 'pointer',
                    }}
                  >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function StatusClient({ status, rejectionReason, farm }: Props) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: palette.cream }}>
      <WaveBg />
      <AnimatePresence mode="wait">
        {status === 'PENDING' ? (
          <PendingView key="pending" />
        ) : (
          <RejectedView key="rejected" rejectionReason={rejectionReason} farm={farm} />
        )}
      </AnimatePresence>
    </div>
  )
}
