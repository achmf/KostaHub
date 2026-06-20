'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { approveRegistration, rejectRegistration } from '@/actions/admin'
import { bulkApproveFarms, bulkRejectFarms } from '@/actions/admin/bulkApproval'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, User, Building2, Phone, Mail, MapPin, FileText, ExternalLink, AlertTriangle, CheckSquare, Square, CheckCheck } from 'lucide-react'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.10)',
  danger: '#B5443B',
  dangerBg: 'rgba(181,68,59,0.08)',
  dangerBorder: 'rgba(181,68,59,0.2)',
}

type FarmData = {
  id: string
  nama: string
  alamat: string | null
  lat: number | null
  lng: number | null
  deskripsi: string | null
  sertifikatUrl: string | null
}

type PendingUser = {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: Date
  // New multi-farm structure (from UserFarm junction)
  farms?: { farm: FarmData }[]
  // Computed for display (backward compat)
  farm?: FarmData | null
}

// ─── Reject Reason Modal ────────────────────────────────────────────────────────
function RejectModal({
  user,
  onConfirm,
  onCancel,
  isLoading,
}: {
  user: PendingUser
  onConfirm: (reason: string) => void
  onCancel: () => void
  isLoading: boolean
}) {
  const [reason, setReason] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onConfirm(reason.trim())
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(13,20,15,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-[440px] rounded-2xl overflow-hidden"
        style={{ background: '#fff', border: `1px solid ${palette.border}` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4" style={{ borderBottom: `1px solid ${palette.border}` }}>
          <div className="flex items-center gap-3 mb-1">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center"
              style={{ background: palette.dangerBg }}
            >
              <AlertTriangle size={16} style={{ color: palette.danger }} />
            </div>
            <div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontWeight: 600, fontSize: 15, color: palette.ink }}>
                Tolak Pendaftaran
              </div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
                {user.name} — {user.farm?.nama}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.7)', lineHeight: 1.6 }}>
            Owner akan mendapat notifikasi email dengan alasan penolakan dan dapat{' '}
            <strong style={{ color: palette.ink }}>mengajukan ulang</strong> setelah merevisi data farm.
          </p>

          <div>
            <label
              htmlFor="reject-reason"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.5)', display: 'block', marginBottom: 8 }}
            >
              ALASAN PENOLAKAN <span style={{ opacity: 0.5 }}>(opsional)</span>
            </label>
            <textarea
              id="reject-reason"
              ref={textareaRef}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Contoh: Sertifikat farm belum dilampirkan, data alamat tidak lengkap..."
              className="w-full px-4 py-3 rounded-xl transition-all resize-none"
              style={{
                background: 'rgba(13,20,15,0.03)',
                border: `1px solid ${palette.border}`,
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
                color: palette.ink,
                outline: 'none',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = palette.danger; e.currentTarget.style.background = '#fff' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.background = 'rgba(13,20,15,0.03)' }}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="cursor-pointer flex-1 py-3 rounded-full transition-opacity hover:opacity-70"
              style={{
                background: 'rgba(13,20,15,0.06)',
                color: palette.ink,
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
                border: `1px solid ${palette.border}`,
              }}
            >
              Batal
            </button>
            <button
              id="confirm-reject-btn"
              type="submit"
              disabled={isLoading}
              className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-opacity"
              style={{
                background: palette.danger,
                color: '#fff',
                fontFamily: "'Inter',sans-serif",
                fontSize: 13,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer',
              }}
            >
              <X size={14} />
              {isLoading ? 'Memproses…' : 'Tolak Pendaftaran'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function ApprovalList({ users }: { users: PendingUser[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [rejectingUser, setRejectingUser] = useState<PendingUser | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set())

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkMode, setBulkMode] = useState(false)
  const [isBulking, startBulkTransition] = useTransition()

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  function handleApprove(userId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm('Setujui pendaftaran ini? Owner akan bisa mengakses dashboard.')) return

    setProcessingId(userId)
    startTransition(async () => {
      try {
        const res = await approveRegistration(userId)
        if (res?.error) {
          showToast(res.error, 'error')
        } else {
          setRemovedIds((prev) => new Set(prev).add(userId))
          showToast('Pendaftaran disetujui. Email notifikasi terkirim.', 'success')
        }
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Terjadi kesalahan sistem', 'error')
      } finally {
        setProcessingId(null)
      }
    })
  }

  function handleRejectConfirm(reason: string) {
    if (!rejectingUser) return
    const userId = rejectingUser.id
    setProcessingId(userId)
    setRejectingUser(null)

    startTransition(async () => {
      try {
        const res = await rejectRegistration(userId, reason)
        if (res?.error) {
          showToast(res.error, 'error')
        } else {
          setRemovedIds((prev) => new Set(prev).add(userId))
          showToast('Pendaftaran ditolak. Owner dapat mengajukan ulang setelah revisi.', 'success')
        }
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : 'Terjadi kesalahan sistem', 'error')
      } finally {
        setProcessingId(null)
      }
    })
  }

  function handleBulkApprove() {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    if (!window.confirm(`Setujui ${ids.length} farm yang dipilih?`)) return
    startBulkTransition(async () => {
      const res = await bulkApproveFarms(ids)
      if (res?.error) {
        showToast(res.error, 'error')
      } else {
        setRemovedIds((prev) => new Set([...prev, ...ids]))
        setSelectedIds(new Set())
        setBulkMode(false)
        showToast(`${res.count} farm berhasil disetujui.`, 'success')
      }
    })
  }

  function handleBulkReject() {
    const ids = Array.from(selectedIds)
    if (!ids.length) return
    const reason = window.prompt('Alasan penolakan (opsional):') ?? ''
    startBulkTransition(async () => {
      const res = await bulkRejectFarms(ids, reason)
      if (res?.error) {
        showToast(res.error, 'error')
      } else {
        setRemovedIds((prev) => new Set([...prev, ...ids]))
        setSelectedIds(new Set())
        setBulkMode(false)
        showToast(`${res.count} farm ditolak.`, 'success')
      }
    })
  }

  const visibleUsers = users.filter((u) => !removedIds.has(u.id))
  const allSelected = visibleUsers.length > 0 && visibleUsers.every((u) => selectedIds.has(u.id))

  return (
    <div className="space-y-3 relative">
      {/* Bulk Toolbar */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <button
          onClick={() => {
            setBulkMode((p) => !p)
            setSelectedIds(new Set())
          }}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-xl transition-all"
          style={{
            fontFamily: "'Inter',sans-serif",
            fontSize: 12,
            background: bulkMode ? palette.forest : '#fff',
            color: bulkMode ? palette.cream : palette.ink,
            border: `1px solid ${bulkMode ? palette.forest : 'rgba(13,20,15,0.1)'}`,
          }}
        >
          {bulkMode ? <CheckSquare size={13} /> : <Square size={13} />}
          {bulkMode ? 'Mode Bulk Aktif' : 'Mode Pilihan Massal'}
        </button>

        {bulkMode && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (allSelected) setSelectedIds(new Set())
                else setSelectedIds(new Set(visibleUsers.map((u) => u.id)))
              }}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 10,
                background: 'rgba(13,20,15,0.06)',
                color: palette.ink,
                border: '1px solid rgba(13,20,15,0.1)',
              }}
            >
              <CheckCheck size={11} />
              {allSelected ? 'Batal Semua' : 'Pilih Semua'}
            </button>
            {selectedIds.size > 0 && (
              <>
                <button
                  onClick={handleBulkApprove}
                  disabled={isBulking}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 12,
                    background: palette.forest,
                    color: palette.cream,
                    opacity: isBulking ? 0.6 : 1,
                  }}
                >
                  <Check size={12} />
                  Setujui {selectedIds.size}
                </button>
                <button
                  onClick={handleBulkReject}
                  disabled={isBulking}
                  className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all"
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 12,
                    background: 'rgba(181,68,59,0.1)',
                    color: palette.danger,
                    border: '1px solid rgba(181,68,59,0.3)',
                    opacity: isBulking ? 0.6 : 1,
                  }}
                >
                  <X size={12} />
                  Tolak {selectedIds.size}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 px-6 py-3 rounded-full flex items-center gap-2 shadow-lg"
            style={{
              background: toast.type === 'success' ? palette.forest : palette.danger,
              color: palette.cream,
              fontFamily: "'Inter',sans-serif",
              fontSize: 14,
            }}
          >
            {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectingUser && (
          <RejectModal
            user={rejectingUser}
            onConfirm={handleRejectConfirm}
            onCancel={() => setRejectingUser(null)}
            isLoading={isPending && processingId === rejectingUser.id}
          />
        )}
      </AnimatePresence>

      {/* User cards */}
      {visibleUsers.map((rawUser) => {
        // Compute farm dari junction table (farms[0]) jika belum ada
        const user: PendingUser = {
          ...rawUser,
          farm: rawUser.farm ?? (rawUser.farms?.[0]?.farm ?? null),
        }
        const isExpanded = expandedId === user.id
        const isProcessing = processingId === user.id && isPending
        const isSelected = selectedIds.has(user.id)

        return (
          <motion.div
            key={user.id}
            layout
            className="rounded-2xl overflow-hidden"
            style={{
              background: '#fff',
              border: `1px solid ${isSelected ? palette.ochre : palette.border}`,
              outline: isSelected ? `2px solid rgba(199,135,62,0.25)` : 'none',
            }}
          >
            {/* Summary row */}
            <div className="w-full flex items-center gap-3 px-6 py-5">
              {/* Checkbox */}
              {bulkMode && (
                <button
                  className="cursor-pointer shrink-0"
                  onClick={() => {
                    setSelectedIds((prev) => {
                      const next = new Set(prev)
                      if (next.has(user.id)) next.delete(user.id)
                      else next.add(user.id)
                      return next
                    })
                  }}
                  aria-label={isSelected ? 'Hapus pilihan' : 'Pilih farm ini'}
                >
                  {isSelected
                    ? <CheckSquare size={17} style={{ color: palette.ochre }} />
                    : <Square size={17} style={{ color: 'rgba(13,20,15,0.3)' }} />
                  }
                </button>
              )}
              <button
                className="cursor-pointer flex-1 flex items-center gap-4 text-left"
                onClick={() => !bulkMode && setExpandedId(isExpanded ? null : user.id)}
                style={{ fontFamily: "'Inter',sans-serif" }}
              >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{ background: palette.ochre, color: palette.ink, fontFamily: "'Fraunces',serif", fontSize: 16 }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span style={{ fontWeight: 500, fontSize: 15 }}>{user.name}</span>
                  <span
                    className="px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(199,135,62,0.15)',
                      color: palette.ochre,
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 9,
                      letterSpacing: '0.1em',
                    }}
                  >
                    PENDING
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1" style={{ fontSize: 12, color: 'rgba(13,20,15,0.5)' }}>
                  <span className="flex items-center gap-1"><Building2 size={11} />{user.farm?.nama}</span>
                  <span className="flex items-center gap-1"><Mail size={11} />{user.email}</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'rgba(13,20,15,0.4)', fontFamily: "'JetBrains Mono',monospace" }}>
                {new Date(user.createdAt).toLocaleDateString('id-ID')}
              </div>
              </button>
            </div>

            {/* Expanded detail */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-6 pb-6 border-t" style={{ borderColor: palette.border }}>
                    <div className="grid md:grid-cols-2 gap-6 pt-5">
                      {/* Owner info */}
                      <div>
                        <div className="mb-3" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)' }}>
                          DATA OWNER
                        </div>
                        <div className="space-y-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                          <div className="flex items-center gap-2"><User size={13} style={{ opacity: 0.5 }} />{user.name}</div>
                          <div className="flex items-center gap-2"><Mail size={13} style={{ opacity: 0.5 }} />{user.email}</div>
                          {user.phone && <div className="flex items-center gap-2"><Phone size={13} style={{ opacity: 0.5 }} />{user.phone}</div>}
                        </div>
                      </div>

                      {/* Farm info */}
                      <div>
                        <div className="mb-3" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)' }}>
                          DATA FARM
                        </div>
                        <div className="space-y-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                          <div className="flex items-center gap-2"><Building2 size={13} style={{ opacity: 0.5 }} />{user.farm?.nama}</div>
                          {user.farm?.alamat && <div className="flex items-center gap-2"><MapPin size={13} style={{ opacity: 0.5 }} />{user.farm.alamat}</div>}
                          {(user.farm?.lat && user.farm?.lng) && (
                            <div className="flex items-center gap-2" style={{ color: 'rgba(13,20,15,0.6)' }}>
                              <MapPin size={13} style={{ opacity: 0.5 }} />
                              {user.farm.lat.toFixed(6)}, {user.farm.lng.toFixed(6)}
                            </div>
                          )}
                          {user.farm?.deskripsi && <div className="flex items-start gap-2"><FileText size={13} style={{ opacity: 0.5, marginTop: 2 }} />{user.farm.deskripsi}</div>}
                          {user.farm?.sertifikatUrl && (
                            <a href={user.farm.sertifikatUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" style={{ color: palette.ochre }}>
                              <ExternalLink size={13} />Lihat Sertifikat
                            </a>
                          )}
                        </div>

                        {/* Map Preview */}
                        {(user.farm?.lat && user.farm?.lng) && (
                          <div className="mt-4 rounded-xl overflow-hidden" style={{ border: `1px solid ${palette.border}` }}>
                            <div
                              className="flex items-center gap-1.5 px-3 py-2"
                              style={{
                                background: 'rgba(13,20,15,0.03)',
                                borderBottom: `1px solid ${palette.border}`,
                                fontFamily: "'JetBrains Mono',monospace",
                                fontSize: 9,
                                letterSpacing: '0.15em',
                                color: 'rgba(13,20,15,0.4)',
                              }}
                            >
                              <MapPin size={9} />
                              LOKASI FARM
                            </div>
                            <iframe
                              src={`https://www.openstreetmap.org/export/embed.html?bbox=${user.farm.lng - 0.01}%2C${user.farm.lat - 0.01}%2C${user.farm.lng + 0.01}%2C${user.farm.lat + 0.01}&layer=mapnik&marker=${user.farm.lat}%2C${user.farm.lng}`}
                              width="100%"
                              height="200"
                              style={{ border: 'none', display: 'block' }}
                              loading="lazy"
                              title={`Lokasi ${user.farm.nama}`}
                            />
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${user.farm.lat}&mlon=${user.farm.lng}#map=15/${user.farm.lat}/${user.farm.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-1.5 py-2 transition-opacity hover:opacity-70"
                              style={{
                                fontFamily: "'Inter',sans-serif",
                                fontSize: 11,
                                color: palette.ochre,
                                borderTop: `1px solid ${palette.border}`,
                              }}
                            >
                              <ExternalLink size={11} />
                              Buka di OpenStreetMap
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: palette.border }}>
                      <button
                        id={`approve-btn-${user.id}`}
                        type="button"
                        onClick={(e) => handleApprove(user.id, e)}
                        disabled={isProcessing}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all"
                        style={{
                          background: palette.forest,
                          color: palette.cream,
                          fontFamily: "'Inter',sans-serif",
                          fontSize: 13,
                          opacity: isProcessing ? 0.6 : 1,
                        }}
                      >
                        <Check size={15} />
                        {isProcessing ? 'Memproses…' : 'Setujui'}
                      </button>
                      <button
                        id={`reject-btn-${user.id}`}
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setRejectingUser(user) }}
                        disabled={isProcessing}
                        className="cursor-pointer flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all"
                        style={{
                          background: palette.dangerBg,
                          color: palette.danger,
                          border: `1px solid ${palette.dangerBorder}`,
                          fontFamily: "'Inter',sans-serif",
                          fontSize: 13,
                          opacity: isProcessing ? 0.6 : 1,
                        }}
                      >
                        <X size={15} />
                        {isProcessing ? 'Memproses…' : 'Tolak'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )
      })}
    </div>
  )
}
