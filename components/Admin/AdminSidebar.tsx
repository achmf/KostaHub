'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  Users,
  Building2,
  LayoutDashboard,
  BarChart3,
  FileText,
  Bell,
  MapPin,
  Activity,
  Megaphone,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'
import { GoatMark } from '@/components/GoatMark'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  forestLight: '#243326',
  ochre: '#C7873E',
  ochreSoft: '#E2B883',
  ink: '#0D140F',
  muted: 'rgba(242,237,224,0.5)',
}

const nav = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, group: 'OVERVIEW', exact: true },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, group: 'OVERVIEW' },
  { href: '/admin/approvals', label: 'Persetujuan', icon: ShieldCheck, group: 'MANAJEMEN', badgeKey: 'approvals' },
  { href: '/admin/farms', label: 'Semua Farm', icon: Building2, group: 'MANAJEMEN' },
  { href: '/admin/map', label: 'Peta GIS', icon: MapPin, group: 'MANAJEMEN' },
  { href: '/admin/users', label: 'Semua User', icon: Users, group: 'MANAJEMEN' },
  { href: '/admin/activity', label: 'Activity Log', icon: Activity, group: 'MANAJEMEN' },
  { href: '/admin/announcements', label: 'Pengumuman', icon: Megaphone, group: 'MANAJEMEN' },
  { href: '/admin/laporan', label: 'Laporan', icon: FileText, group: 'LAPORAN' },
]

const groups = Array.from(new Set(nav.map((n) => n.group)))

interface AdminSidebarProps {
  name: string
  email: string
  pendingCount?: number
}

export default function AdminSidebar({ name, email, pendingCount: initialPendingCount = 0 }: AdminSidebarProps) {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(initialPendingCount)
  const [isOpen, setIsOpen] = useState(true)

  // Poll pending count every 30 seconds
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/api/admin/pending-count', { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          setPendingCount(data.count)
        }
      } catch {
        // Silently fail — network issues shouldn't break the sidebar
      }
    }

    const interval = setInterval(poll, 30_000)
    return () => clearInterval(interval)
  }, [])

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <motion.aside
      animate={{ width: isOpen ? 260 : 72 }}
      transition={{ type: 'spring', stiffness: 400, damping: 40 }}
      className="hidden lg:flex flex-col shrink-0 sticky top-0 h-screen z-40 overflow-hidden"
      style={{ background: palette.forest, color: palette.cream }}
    >
      {/* Brand */}
      <div className={`pt-7 pb-6 flex items-center ${isOpen ? 'px-6 gap-2.5' : 'justify-center px-0'}`}>
        <GoatMark className="w-7 h-7 shrink-0" />
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
              <div style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 19, letterSpacing: '-0.02em' }}>
                KostaHub
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize: 8,
                  letterSpacing: '0.2em',
                  opacity: 0.5,
                  marginTop: 2,
                }}
              >
                BACKOFFICE ADMIN
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
        {groups.map((g) => {
          const groupNavs = nav.filter((n) => n.group === g)
          if (groupNavs.length === 0) return null

          return (
          <div key={g} className="mb-5">
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="open-group"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.4 }}
                  exit={{ opacity: 0 }}
                  className="px-3 mb-1.5"
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    letterSpacing: '0.2em',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {g}
                </motion.div>
              ) : (
                <motion.div
                  key="closed-group"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.3 }}
                  exit={{ opacity: 0 }}
                  className="mb-1.5 text-center"
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: 9,
                    letterSpacing: '0.1em',
                  }}
                >
                  •••
                </motion.div>
              )}
            </AnimatePresence>
            
            {groupNavs.map((n) => {
                const active = isActive(n.href, n.exact)
                const Icon = n.icon
                const hasBadge = n.badgeKey === 'approvals' && pendingCount > 0
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`cursor-pointer relative flex items-center py-2.5 rounded-lg mb-0.5 hover:bg-white/5 transition-all duration-200 ${
                      isOpen ? 'px-3 gap-3 w-full text-left' : 'justify-center mx-auto w-10 h-10 px-0'
                    }`}
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5 }}
                    title={!isOpen ? n.label : undefined}
                  >
                    {active && (
                      <motion.div
                        layoutId="admin-nav-bg"
                        className="absolute inset-0 rounded-lg"
                        style={{ background: 'rgba(199,135,62,0.18)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon
                      size={15}
                      className="relative shrink-0"
                      style={{
                        opacity: active ? 1 : 0.6,
                        color: active ? palette.ochreSoft : palette.cream,
                      }}
                    />
                    <AnimatePresence>
                      {isOpen && (
                        <motion.span 
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: active ? 1 : 0.7, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          className="relative whitespace-nowrap overflow-hidden" 
                        >
                          {n.label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {hasBadge && isOpen && (
                      <span
                        className="relative px-1.5 py-0.5 rounded-full text-center"
                        style={{
                          background: '#B5443B',
                          color: '#fff',
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 9,
                          minWidth: 18,
                        }}
                      >
                        {pendingCount > 9 ? '9+' : pendingCount}
                      </span>
                    )}
                    {hasBadge && !isOpen && (
                      <span
                        className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
                        style={{
                          background: '#B5443B',
                          border: `2px solid ${palette.forest}`
                        }}
                      />
                    )}

                    {active && !hasBadge && isOpen && (
                      <span className="relative ml-auto shrink-0 w-1.5 h-1.5 rounded-full" style={{ background: palette.ochre }} />
                    )}
                  </Link>
                )
              })}
          </div>
          )
        })}
      </nav>

      {/* Notification hint */}
      <AnimatePresence>
        {pendingCount > 0 && isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mx-4 mb-3 px-3 py-2.5 rounded-lg flex items-center gap-2 overflow-hidden whitespace-nowrap shrink-0"
            style={{ background: 'rgba(181,68,59,0.15)', border: '1px solid rgba(181,68,59,0.25)' }}
          >
            <Bell size={12} style={{ color: '#E07B74', flexShrink: 0 }} />
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: '#E07B74' }}>
              {pendingCount} permohonan menunggu
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer Toggle */}
      <div className="p-3 mt-auto" style={{ borderTop: '1px solid rgba(242,237,224,0.05)' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`cursor-pointer w-full flex items-center py-2.5 rounded-md hover:bg-white/5 transition-all text-white/50 hover:text-white/80 ${
            isOpen ? 'justify-start px-3 gap-3' : 'justify-center px-0'
          }`}
          title={isOpen ? 'Tutup sidebar' : 'Buka sidebar'}
        >
          {isOpen ? <PanelLeftClose size={16} className="shrink-0" /> : <PanelLeftOpen size={16} className="shrink-0" />}
          <AnimatePresence>
            {isOpen && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                className="whitespace-nowrap overflow-hidden text-sm"
                style={{ fontFamily: "'Inter',sans-serif" }}
              >
                Ciutkan
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

    </motion.aside>
  )
}
