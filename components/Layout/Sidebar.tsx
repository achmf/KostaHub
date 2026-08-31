'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Users,
  Users2,
  Stethoscope,
  Heart,
  Scale,
  FileBarChart,
  Bell,
  Map,
  Building2,
  Shield,
  ArrowLeft,
} from 'lucide-react'
import { GoatMark } from '@/components/GoatMark'
import { logout } from '@/actions/auth'
import { palette } from '@/components/KostaUI'



type NavItem = {
  href: string
  label: string
  icon: React.FC<{ size?: number; style?: React.CSSProperties; className?: string }>
  group: string
}

type NavItemDef = NavItem & { roles?: string[] }

const allNav: NavItemDef[] = [
  { href: '/', label: 'Dasbor', icon: LayoutDashboard, group: 'OPERASIONAL' },
  { href: '/hewan', label: 'Populasi', icon: Users, group: 'OPERASIONAL' },
  { href: '/medis', label: 'Rekam Medis', icon: Stethoscope, group: 'OPERASIONAL' },
  { href: '/reproduksi', label: 'Reproduksi', icon: Heart, group: 'OPERASIONAL' },
  { href: '/berat', label: 'Berat Badan', icon: Scale, group: 'OPERASIONAL' },
  { href: '/laporan', label: 'Laporan', icon: FileBarChart, group: 'ANALITIK' },
  { href: '/map', label: 'Peta GIS', icon: Map, group: 'ANALITIK' },
  { href: '/notifikasi', label: 'Notifikasi', icon: Bell, group: 'ANALITIK' },
  { href: '/staff', label: 'Kelola Staff', icon: Users2, group: 'MANAJEMEN', roles: ['OWNER'] },
  { href: '/farm', label: 'Manajemen Farm', icon: Building2, group: 'ADMIN', roles: ['SUPER_ADMIN'] },
  { href: '/admin/approvals', label: 'Backoffice', icon: Shield, group: 'ADMIN', roles: ['SUPER_ADMIN'] },
]



interface SidebarProps {
  role: string
  name: string
  email: string
  farmName?: string
  userId: string
}

export default function Sidebar({ role, name, email, farmName }: SidebarProps) {
  const pathname = usePathname()
  const [unreadCount, setUnreadCount] = useState(0)

  // Poll unread count every 90s
  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('/api/notifikasi')
        if (!res.ok) return
        const data: { isRead: boolean }[] = await res.json()
        setUnreadCount(data.filter((n) => !n.isRead).length)
      } catch {}
    }
    fetchCount()
    const interval = setInterval(fetchCount, 90_000)
    return () => clearInterval(interval)
  }, [])

  const nav = allNav.filter((n) => !n.roles || n.roles.includes(role))
  const groups = Array.from(new Set(nav.map((n) => n.group)))

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="hidden lg:flex flex-col w-[260px] shrink-0 sticky top-0 h-screen"
      style={{ background: palette.forest, color: palette.cream }}
    >
      {/* Brand */}
      <div className="px-6 pt-7 pb-8 flex items-center gap-2.5">
        <GoatMark className="w-7 h-7" />
        <div>
          <div
            style={{
              fontFamily: "'Fraunces',serif",
              fontWeight: 600,
              fontSize: 19,
              letterSpacing: '-0.02em',
            }}
          >
            KostaHub
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1 overflow-y-auto">
        {groups.map((g) => (
          <div key={g} className="mb-6">
            <div
              className="px-3 mb-2"
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 9,
                letterSpacing: '0.2em',
                opacity: 0.5,
              }}
            >
              {g}
            </div>
            {nav
              .filter((n) => n.group === g)
              .map((n) => {
                const active = isActive(n.href)
                const Icon = n.icon
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className="cursor-pointer w-full text-left relative flex items-center gap-3 px-3 py-2.5 rounded-md mb-0.5"
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5 }}
                  >
                    {active && (
                      <motion.div
                        layoutId="nav-bg"
                        className="absolute inset-0 rounded-md"
                        style={{ background: 'rgba(199,135,62,0.18)' }}
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <Icon
                      size={15}
                      className="relative"
                      style={{
                        opacity: active ? 1 : 0.7,
                        color: active ? palette.ochreSoft : palette.cream,
                      }}
                    />
                    <span className="relative" style={{ opacity: active ? 1 : 0.7 }}>
                      {n.label}
                    </span>
                    {/* Unread badge for Notifikasi */}
                    {n.href === '/notifikasi' && unreadCount > 0 && (
                      <span
                        className="relative ml-auto flex items-center justify-center rounded-full"
                        style={{
                          background: palette.ochre,
                          color: palette.ink,
                          fontFamily: "'JetBrains Mono',monospace",
                          fontSize: 9,
                          minWidth: 18,
                          height: 18,
                          padding: '0 4px',
                          fontWeight: 600,
                        }}
                      >
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                    {active && n.href !== '/notifikasi' && (
                      <span
                        className="relative ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: palette.ochre }}
                      />
                    )}
                  </Link>
                )
              })}
          </div>
        ))}
      </nav>

    </aside>
  )
}
