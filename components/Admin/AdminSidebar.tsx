'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  Users,
  Building2,
  LayoutDashboard,
  BarChart3,
  FileText,
  LogOut,
  Bell,
  MapPin,
  Activity,
  Megaphone,
} from 'lucide-react'
import { GoatMark } from '@/components/GoatMark'
import { logout } from '@/actions/auth'

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
    <aside
      className="hidden lg:flex flex-col w-[260px] shrink-0 sticky top-0 h-screen overflow-hidden"
      style={{ background: palette.forest, color: palette.cream }}
    >
      {/* Brand */}
      <div className="px-6 pt-7 pb-6 flex items-center gap-2.5">
        <GoatMark className="w-7 h-7" />
        <div>
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
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1 overflow-y-auto">
        {groups.map((g) => (
          <div key={g} className="mb-5">
            <div
              className="px-3 mb-1.5"
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 9,
                letterSpacing: '0.2em',
                opacity: 0.4,
              }}
            >
              {g}
            </div>
            {nav
              .filter((n) => n.group === g)
              .map((n) => {
                const active = isActive(n.href, n.exact)
                const Icon = n.icon
                const hasBadge = n.badgeKey === 'approvals' && pendingCount > 0
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="w-full text-left relative flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 transition-colors"
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5 }}
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
                    <span className="relative flex-1" style={{ opacity: active ? 1 : 0.7 }}>
                      {n.label}
                    </span>
                    {hasBadge && (
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
                    {active && !hasBadge && (
                      <span className="relative ml-auto w-1.5 h-1.5 rounded-full" style={{ background: palette.ochre }} />
                    )}
                  </Link>
                )
              })}
          </div>
        ))}
      </nav>

      {/* Notification hint */}
      {pendingCount > 0 && (
        <div
          className="mx-4 mb-3 px-3 py-2.5 rounded-lg flex items-center gap-2"
          style={{ background: 'rgba(181,68,59,0.15)', border: '1px solid rgba(181,68,59,0.25)' }}
        >
          <Bell size={12} style={{ color: '#E07B74', flexShrink: 0 }} />
          <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11.5, color: '#E07B74' }}>
            {pendingCount} permohonan menunggu
          </span>
        </div>
      )}

      {/* User panel */}
      <div
        className="m-4 p-4 rounded-xl"
        style={{
          background: 'rgba(242,237,224,0.06)',
          border: '1px solid rgba(242,237,224,0.10)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: palette.ochre,
              color: palette.ink,
              fontFamily: "'Fraunces',serif",
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, fontWeight: 500 }}>{name}</div>
            <div
              className="opacity-50 truncate"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.05em' }}
            >
              SUPER ADMIN
            </div>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="cursor-pointer mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-lg transition-opacity hover:opacity-80"
            style={{
              background: 'transparent',
              color: palette.cream,
              border: '1px solid rgba(242,237,224,0.18)',
              fontFamily: "'Inter',sans-serif",
              fontSize: 12,
            }}
          >
            <LogOut size={11} /> Keluar
          </button>
        </form>
      </div>
    </aside>
  )
}
