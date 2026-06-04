'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ochre: '#C7873E',
  ochreSoft: '#E2B883',
  ink: '#0D140F',
}

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
}

export default function Sidebar({ role, name, email }: SidebarProps) {
  const pathname = usePathname()

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
                    className="w-full text-left relative flex items-center gap-3 px-3 py-2.5 rounded-md mb-0.5"
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
                    {active && (
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
            }}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div style={{ fontFamily: "'Inter',sans-serif", fontSize: 13 }}>{name}</div>
            <div
              className="opacity-60 truncate"
              style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}
            >
              {email}
            </div>
          </div>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="mt-3 w-full flex items-center justify-center gap-2 py-2 rounded-md"
            style={{
              background: 'transparent',
              color: palette.cream,
              border: '1px solid rgba(242,237,224,0.18)',
              fontFamily: "'Inter',sans-serif",
              fontSize: 12,
            }}
          >
            <ArrowLeft size={12} /> Keluar
          </button>
        </form>
      </div>
    </aside>
  )
}
