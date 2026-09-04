'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Syringe, PawPrint, Scale, Bell, Check,
  CheckCheck, BellOff, BellRing, RefreshCw, Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { useNotifikasi } from '@/hooks/useNotifikasi'
import { KostaPageHeader, KostaButton, Badge, palette } from '@/components/KostaUI'
import { Toaster } from 'sonner'
import PaginationControl from '@/components/Admin/PaginationControl'
import { usePagination } from '@/hooks/usePagination'

const ICONS: Record<string, React.FC<{ size?: number }>> = {
  MEDIS: Syringe,
  LAHIR: PawPrint,
  BERAT: Scale,
}



const TYPE_LABEL: Record<string, string> = {
  MEDIS: 'Jadwal Medis',
  LAHIR:  'Kelahiran',
  BERAT:  'Timbang',
}

type FilterType = 'ALL' | 'MEDIS' | 'LAHIR' | 'BERAT'

export function ClientNotifList() {
  const {
    list, loading, unreadCount,
    pushEnabled, requestPushPermission,
    markRead, markAllRead, refetch,
  } = useNotifikasi()

  const [filter, setFilter] = useState<FilterType>('ALL')
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filtered = list.filter((n) => filter === 'ALL' || n.type === filter)

  const PER_PAGE = 15
  const { paged, page, totalPages, onPrev, onNext } = usePagination(filtered, PER_PAGE)

  const handleMarkRead = async (id: string) => {
    setPendingId(id)
    await markRead(id)
    setPendingId(null)
  }

  return (
    <>
      <Toaster position="top-right" richColors />

      <div>
        <KostaPageHeader
          title="Notifikasi Operasional"
          description={
            unreadCount > 0
              ? `${unreadCount} notifikasi belum dibaca — jadwal medis, kelahiran, dan penimbangan.`
              : 'Semua notifikasi sudah dibaca. Tidak ada yang perlu tindakan.'
          }
          action={
            <div className="flex items-center gap-2">
              {/* Refresh */}
              <button
                onClick={refetch}
                disabled={loading}
                className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{ border: `1px solid ${palette.border}` }}
                title="Refresh"
              >
                {loading
                  ? <Loader2 size={14} className="animate-spin" style={{ opacity: 0.5 }} />
                  : <RefreshCw size={14} style={{ opacity: 0.6 }} />
                }
              </button>

              {/* Push toggle */}
              <button
                onClick={requestPushPermission}
                className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{
                  border: `1px solid ${palette.border}`,
                  color: pushEnabled ? palette.moss : 'rgba(13,20,15,0.45)',
                }}
                title={pushEnabled ? 'Push aktif' : 'Aktifkan push notification'}
              >
                {pushEnabled ? <BellRing size={14} /> : <BellOff size={14} />}
              </button>

              {/* Mark all read */}
              {unreadCount > 0 && (
                <KostaButton variant="outline" onClick={markAllRead}>
                  <CheckCheck size={13} /> Baca Semua
                </KostaButton>
              )}
            </div>
          }
        />

        {/* Push permission banner */}
        {!pushEnabled && mounted && 'PushManager' in window && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 flex items-center gap-4 px-5 py-4 rounded-2xl"
            style={{
              background: 'rgba(63,122,78,0.06)',
              border: '1px solid rgba(63,122,78,0.2)',
            }}
          >
            <BellRing size={16} style={{ color: palette.moss, flexShrink: 0 }} />
            <div className="flex-1">
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500 }}>
                Aktifkan Push Notification
              </div>
              <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, opacity: 0.6, marginTop: 2 }}>
                Terima peringatan otomatis di browser walau halaman tidak terbuka.
              </div>
            </div>
            <KostaButton onClick={requestPushPermission}>
              <BellRing size={12} /> Aktifkan
            </KostaButton>
          </motion.div>
        )}

        {/* Filter chips */}
        <div className="flex flex-wrap gap-2 mb-5">
          {(['ALL', 'MEDIS', 'LAHIR', 'BERAT'] as FilterType[]).map((f) => {
            const count = f === 'ALL' ? list.length : list.filter((n) => n.type === f).length
            const unread = f === 'ALL'
              ? list.filter((n) => !n.isRead).length
              : list.filter((n) => n.type === f && !n.isRead).length
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="cursor-pointer relative px-4 py-2 rounded-full flex items-center gap-2"
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 10.5,
                  letterSpacing: '0.1em',
                  border: `1px solid ${palette.border}`,
                }}
              >
                {filter === f && (
                  <motion.div
                    layoutId="notif-pill"
                    className="absolute inset-0 rounded-full"
                    style={{ background: palette.ink }}
                  />
                )}
                <span className="relative" style={{ color: filter === f ? palette.cream : palette.ink }}>
                  {f === 'ALL' ? 'SEMUA' : f}
                </span>
                <span className="relative" style={{
                  color: filter === f ? 'rgba(242,237,224,0.55)' : 'rgba(13,20,15,0.45)',
                  fontSize: 9.5,
                }}>
                  {count}
                </span>
                {unread > 0 && (
                  <span
                    className="relative w-1.5 h-1.5 rounded-full"
                    style={{ background: filter === f ? palette.cream : palette.ochre }}
                  />
                )}
              </button>
            )
          })}
        </div>

        {/* List */}
        <div className="space-y-2.5">
          {loading && list.length === 0 && (
            <div className="py-16 flex items-center justify-center gap-3"
              style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, opacity: 0.5 }}>
              <Loader2 size={16} className="animate-spin" />
              Memuat notifikasi...
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-16 text-center"
              style={{ fontFamily: "'Fraunces',serif", fontSize: 22, fontStyle: 'italic', color: palette.moss }}
            >
              Tidak ada notifikasi{filter !== 'ALL' ? ` kategori ${filter}` : ''}.
            </motion.div>
          )}

          <AnimatePresence>
            {paged.map((n, i) => {
              const Icon = ICONS[n.type] ?? Bell
              const tone = { bg: 'rgba(13,20,15,0.08)', fg: palette.ink }
              const isPending = pendingId === n.id

              return (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 8, height: 0, marginBottom: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="rounded-2xl p-4 flex items-center gap-4 group hover:-translate-y-0.5"
                  style={{
                    background: n.isRead ? 'rgba(255,255,255,0.5)' : '#fff',
                    border: `1px solid ${n.isRead ? palette.border : 'rgba(13,20,15,0.12)'}`,
                    boxShadow: n.isRead ? 'none' : '0 4px 16px rgba(13,20,15,0.06)',
                    opacity: n.isRead ? 0.72 : 1,
                    transition: 'all 0.3s ease',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{ background: tone.bg, color: tone.fg }}
                  >
                    <Icon size={16} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="default">
                        {TYPE_LABEL[n.type] ?? n.type}
                      </Badge>
                      {!n.isRead && (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: palette.ochre }} />
                      )}
                    </div>
                    <div
                      className="mt-1.5"
                      style={{
                        fontFamily: "'Inter',sans-serif",
                        fontSize: 14,
                        fontWeight: n.isRead ? 400 : 500,
                      }}
                    >
                      {n.title}
                    </div>
                    <div
                      className="mt-0.5 line-clamp-2"
                      style={{ fontFamily: "'Inter',sans-serif", fontSize: 12.5, opacity: 0.65 }}
                    >
                      {/* Strip internal ref key from message */}
                      {n.message.replace(/\s*\[ref:[^\]]+\]/g, '')}
                    </div>
                    <div
                      className="mt-1"
                      style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.45 }}
                    >
                      {new Date(n.tanggal).toLocaleDateString('id-ID', {
                        day: '2-digit', month: 'long', year: 'numeric',
                      })}
                    </div>
                  </div>

                  {/* Mark read button */}
                  <button
                    onClick={() => handleMarkRead(n.id)}
                    disabled={isPending}
                    className="cursor-pointer w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-all"
                    title={n.isRead ? 'Tandai belum dibaca' : 'Tandai sudah dibaca'}
                    style={{
                      border: `1px solid ${n.isRead ? palette.border : 'rgba(63,122,78,0.3)'}`,
                      background: n.isRead ? 'transparent' : 'rgba(63,122,78,0.08)',
                      color: n.isRead ? 'rgba(13,20,15,0.35)' : palette.emerald,
                    }}
                  >
                    {isPending
                      ? <Loader2 size={13} className="animate-spin" />
                      : <Check size={13} />
                    }
                  </button>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {filtered.length > 0 && (
            <PaginationControl
              page={page}
              totalPages={totalPages}
              onPrev={onPrev}
              onNext={onNext}
              totalItems={filtered.length}
              perPage={PER_PAGE}
            />
          )}
        </div>
      </div>
    </>
  )
}
