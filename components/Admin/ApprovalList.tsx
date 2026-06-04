'use client'

import { useState, useTransition } from 'react'
import { approveRegistration, rejectRegistration } from '@/actions/admin'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, User, Building2, Phone, Mail, MapPin, FileText, ExternalLink } from 'lucide-react'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.10)',
}

type PendingUser = {
  id: string
  name: string
  email: string
  phone: string | null
  createdAt: Date
  farm: {
    id: string
    nama: string
    alamat: string | null
    lat: number | null
    lng: number | null
    deskripsi: string | null
    sertifikatUrl: string | null
  } | null
}

export default function ApprovalList({ users }: { users: PendingUser[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
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
          showToast('Pendaftaran disetujui. Email notifikasi terkirim.', 'success')
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
        showToast(message, 'error')
      } finally {
        setProcessingId(null)
      }
    })
  }

  function handleReject(userId: string, e: React.MouseEvent) {
    e.stopPropagation()
    if (!window.confirm('Tolak pendaftaran ini? Data user dan farm akan dihapus permanen.')) return
    
    setProcessingId(userId)
    startTransition(async () => {
      try {
        const res = await rejectRegistration(userId)
        if (res?.error) {
          showToast(res.error, 'error')
        } else {
          showToast('Pendaftaran ditolak. Email notifikasi terkirim.', 'success')
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem'
        showToast(message, 'error')
      } finally {
        setProcessingId(null)
      }
    })
  }

  return (
    <div className="space-y-3 relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 px-6 py-3 rounded-full flex items-center gap-2 shadow-lg"
            style={{
              background: toast.type === 'success' ? palette.forest : '#B5443B',
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
      {users.map((user) => {
        const isExpanded = expandedId === user.id
        const isProcessing = processingId === user.id && isPending

        return (
          <motion.div
            key={user.id}
            layout
            className="rounded-2xl overflow-hidden"
            style={{ background: '#fff', border: `1px solid ${palette.border}` }}
          >
            {/* Summary row */}
            <button
              className="cursor-pointer w-full flex items-center gap-4 px-6 py-5 text-left"
              onClick={() => setExpandedId(isExpanded ? null : user.id)}
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
                        <div
                          className="mb-3"
                          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)' }}
                        >
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
                        <div
                          className="mb-3"
                          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: 'rgba(13,20,15,0.4)' }}
                        >
                          DATA FARM
                        </div>
                        <div className="space-y-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                          <div className="flex items-center gap-2"><Building2 size={13} style={{ opacity: 0.5 }} />{user.farm?.nama}</div>
                          {user.farm?.alamat && <div className="flex items-center gap-2"><MapPin size={13} style={{ opacity: 0.5 }} />{user.farm.alamat}</div>}
                          {(user.farm?.lat && user.farm?.lng) && (
                            <div className="flex items-center gap-2"><MapPin size={13} style={{ opacity: 0.5 }} />{user.farm.lat}, {user.farm.lng}</div>
                          )}
                          {user.farm?.deskripsi && <div className="flex items-start gap-2"><FileText size={13} style={{ opacity: 0.5, marginTop: 2 }} />{user.farm.deskripsi}</div>}
                          {user.farm?.sertifikatUrl && (
                            <a href={user.farm.sertifikatUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2" style={{ color: palette.ochre }}>
                              <ExternalLink size={13} />Lihat Sertifikat
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 mt-6 pt-5 border-t" style={{ borderColor: palette.border }}>
                      <button
                        type="button"
                        onClick={(e) => handleApprove(user.id, e)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all"
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
                        type="button"
                        onClick={(e) => handleReject(user.id, e)}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-2 py-3 rounded-full transition-all"
                        style={{
                          background: 'rgba(181,68,59,0.08)',
                          color: '#B5443B',
                          border: '1px solid rgba(181,68,59,0.2)',
                          fontFamily: "'Inter',sans-serif",
                          fontSize: 13,
                          opacity: isProcessing ? 0.6 : 1,
                        }}
                      >
                        <X size={15} />
                        {isProcessing ? 'Memproses…' : 'Tolak & Hapus'}
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
