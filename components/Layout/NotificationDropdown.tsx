'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { palette } from '@/components/KostaUI'

type NotifikasiType = {
  id: string
  title: string
  message: string
  tanggal: string
  isRead: boolean
  type: string
}

export default function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotifikasiType[]>([])
  const ref = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.isRead).length
  const displayNotifications = notifications.slice(0, 5)

  // Poll notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifikasi')
        if (!res.ok) return
        const data = await res.json()
        setNotifications(data)
      } catch (err) {
        console.error('Failed to fetch notifications', err)
      }
    }
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 90_000)
    return () => clearInterval(interval)
  }, [])

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClick)
      return () => document.removeEventListener('mousedown', handleClick)
    }
  }, [open])

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) {
      document.addEventListener('keydown', handleKey)
      return () => document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const timeAgo = (dateStr: string) => {
    const ms = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(ms / 60000)
    if (mins < 60) return `${mins}m yang lalu`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}j yang lalu`
    const days = Math.floor(hrs / 24)
    return `${days}h yang lalu`
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.95 }}
        className="cursor-pointer relative flex items-center justify-center w-10 h-10 rounded-full"
        style={{
          border: `1px solid ${palette.border}`,
          background: open ? 'rgba(13,20,15,0.06)' : '#fff',
          transition: 'background 0.15s ease',
        }}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Notifikasi"
      >
        <Bell size={18} style={{ color: palette.ink, opacity: 0.8 }} />
        {unreadCount > 0 && (
          <span
            className="absolute top-0 right-0 flex items-center justify-center rounded-full text-white"
            style={{
              background: '#E25E3E', // a bit more poppy red/orange for alert
              fontSize: 10,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 600,
              minWidth: 16,
              height: 16,
              padding: '0 4px',
              transform: 'translate(25%, -25%)',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96"
            role="menu"
          >
            <div
              className="rounded-xl overflow-hidden flex flex-col"
              style={{
                background: palette.forest,
                color: palette.cream,
                border: '1px solid rgba(242,237,224,0.12)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {/* Header */}
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(242,237,224,0.08)' }}>
                <span style={{ fontFamily: "'Fraunces',serif", fontSize: 16, fontWeight: 600 }}>Notifikasi</span>
                {unreadCount > 0 && (
                  <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, opacity: 0.6 }}>
                    {unreadCount} belum dibaca
                  </span>
                )}
              </div>

              {/* List */}
              <div className="flex flex-col max-h-[360px] overflow-y-auto">
                {displayNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center" style={{ opacity: 0.5, fontFamily: "'Inter',sans-serif", fontSize: 13 }}>
                    Tidak ada notifikasi.
                  </div>
                ) : (
                  displayNotifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="px-4 py-3 flex gap-3 relative"
                      style={{
                        borderBottom: '1px solid rgba(242,237,224,0.04)',
                        background: notif.isRead ? 'transparent' : 'rgba(199,135,62,0.08)',
                      }}
                    >
                      {!notif.isRead && (
                        <div className="absolute left-2 top-4 w-1.5 h-1.5 rounded-full" style={{ background: palette.ochre }} />
                      )}
                      <div className="flex-1 min-w-0 pl-1">
                        <div className="flex justify-between items-start gap-2 mb-1">
                          <span className="font-semibold truncate" style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ochreSoft }}>
                            {notif.title}
                          </span>
                          <span className="shrink-0" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, opacity: 0.5 }}>
                            {timeAgo(notif.tanggal)}
                          </span>
                        </div>
                        <p className="line-clamp-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, opacity: 0.8, lineHeight: 1.4 }}>
                          {notif.message.replace(/\s*\[ref:[^\]]+\]/g, '')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer / View All */}
              <div className="p-2" style={{ borderTop: '1px solid rgba(242,237,224,0.08)' }}>
                <Link
                  href="/notifikasi"
                  onClick={() => setOpen(false)}
                  className="cursor-pointer block text-center py-2.5 rounded-lg w-full transition-colors"
                  style={{
                    fontFamily: "'Inter',sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: palette.cream,
                    opacity: 0.9,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(242,237,224,0.06)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                >
                  Lihat Semua Notifikasi
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
