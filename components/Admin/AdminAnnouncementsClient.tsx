'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Megaphone, Send, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { sendAnnouncement } from '@/actions/admin/sendAnnouncement'
import { useRouter } from 'next/navigation'

const palette = {
  ink: '#0D140F',
  ochre: '#C7873E',
  forest: '#1B2A1F',
  moss: '#3F5B3A',
  danger: '#B5443B',
  border: 'rgba(13,20,15,0.09)',
  muted: 'rgba(13,20,15,0.45)',
}

interface HistoryItem {
  title: string
  message: string
  createdAt: string
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Baru saja'
  if (hrs < 1) return `${mins} menit lalu`
  if (days < 1) return `${hrs} jam lalu`
  if (days < 7) return `${days} hari lalu`
  return new Date(ts).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminAnnouncementsClient({ history }: { history: HistoryItem[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null)

  function showToast(text: string, type: 'success' | 'error') {
    setToast({ text, type })
    setTimeout(() => setToast(null), 4000)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await sendAnnouncement({ title, message })
      if (res.error) {
        showToast(res.error, 'error')
      } else {
        showToast(`Pengumuman terkirim ke ${res.count} farm aktif.`, 'success')
        setTitle('')
        setMessage('')
        router.refresh()
      }
    })
  }

  return (
    <div>
      {/* Header */}
      <motion.div className="mb-8" initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: palette.muted, marginBottom: 6 }}>
          BACKOFFICE
        </div>
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 400, letterSpacing: '-0.025em' }}>
          Pengumuman <span style={{ fontStyle: 'italic', color: palette.ochre }}>Sistem</span>
        </h1>
        <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.6)', marginTop: 4 }}>
          Kirim pengumuman ke seluruh farm aktif. Pesan akan muncul di notifikasi owner.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Compose Form */}
        <motion.div
          className="xl:col-span-2"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="rounded-2xl p-6" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
            <div className="flex items-center gap-2 mb-5">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(199,135,62,0.12)' }}>
                <Megaphone size={15} style={{ color: palette.ochre }} />
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: palette.muted }}>
                  BUAT PENGUMUMAN
                </div>
                <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500, color: palette.ink }}>
                  Broadcast ke semua farm aktif
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="ann-title"
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: palette.muted, display: 'block', marginBottom: 6 }}
                >
                  JUDUL PENGUMUMAN
                </label>
                <input
                  id="ann-title"
                  type="text"
                  required
                  maxLength={100}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Pembaruan Sistem Vaksinasi"
                  className="w-full px-4 py-3 rounded-xl transition-all"
                  style={{
                    background: 'rgba(13,20,15,0.03)',
                    border: `1px solid ${palette.border}`,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 13,
                    color: palette.ink,
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = palette.ochre; e.currentTarget.style.background = '#fff' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.background = 'rgba(13,20,15,0.03)' }}
                />
              </div>
              <div>
                <label
                  htmlFor="ann-message"
                  style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.15em', color: palette.muted, display: 'block', marginBottom: 6 }}
                >
                  ISI PENGUMUMAN
                </label>
                <textarea
                  id="ann-message"
                  required
                  rows={5}
                  maxLength={500}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Tulis isi pengumuman untuk semua peternak..."
                  className="w-full px-4 py-3 rounded-xl transition-all resize-none"
                  style={{
                    background: 'rgba(13,20,15,0.03)',
                    border: `1px solid ${palette.border}`,
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 13,
                    color: palette.ink,
                    outline: 'none',
                  }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = palette.ochre; e.currentTarget.style.background = '#fff' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = palette.border; e.currentTarget.style.background = 'rgba(13,20,15,0.03)' }}
                />
                <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: palette.muted, textAlign: 'right', marginTop: 4 }}>
                  {message.length}/500
                </div>
              </div>
              <button
                id="send-announcement-btn"
                type="submit"
                disabled={isPending || !title.trim() || !message.trim()}
                className="cursor-pointer w-full flex items-center justify-center gap-2 py-3 rounded-full transition-all"
                style={{
                  background: isPending ? 'rgba(27,42,31,0.6)' : palette.forest,
                  color: '#F2EDE0',
                  fontFamily: "'Inter',sans-serif",
                  fontSize: 13,
                  opacity: isPending || !title.trim() || !message.trim() ? 0.6 : 1,
                  cursor: isPending ? 'not-allowed' : 'pointer',
                }}
              >
                <Send size={14} />
                {isPending ? 'Mengirim…' : 'Kirim ke Semua Farm Aktif'}
              </button>
            </form>
          </div>
        </motion.div>

        {/* History */}
        <motion.div
          className="xl:col-span-3"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <div className="rounded-2xl p-6" style={{ background: '#fff', border: `1px solid ${palette.border}` }}>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.2em', color: palette.muted, marginBottom: 16 }}>
              RIWAYAT PENGUMUMAN ({history.length})
            </div>
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <Megaphone size={24} style={{ color: palette.muted }} />
                <p style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.muted }}>
                  Belum ada pengumuman yang pernah dikirim.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="p-4 rounded-xl"
                    style={{ background: 'rgba(13,20,15,0.02)', border: `1px solid ${palette.border}` }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 600, color: palette.ink }}>
                          {item.title}
                        </div>
                        <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, color: 'rgba(13,20,15,0.65)', marginTop: 4, lineHeight: 1.5 }}>
                          {item.message}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, color: 'rgba(13,20,15,0.35)', letterSpacing: '0.05em' }}>
                      <Clock size={9} />
                      {timeAgo(item.createdAt)}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 40, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full shadow-lg"
            style={{
              background: toast.type === 'success' ? palette.forest : palette.danger,
              color: '#F2EDE0',
              fontFamily: "'Inter',sans-serif",
              fontSize: 14,
            }}
          >
            {toast.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
