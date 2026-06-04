'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Users,
  Building2,
  LayoutDashboard,
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

const nav = [
  { href: '/admin/approvals', label: 'Persetujuan', icon: ShieldCheck, group: 'MANAJEMEN' },
  { href: '/admin/users', label: 'Semua User', icon: Users, group: 'MANAJEMEN' },
  { href: '/admin/farms', label: 'Semua Farm', icon: Building2, group: 'MANAJEMEN' },
  { href: '/', label: 'Dashboard Farm', icon: LayoutDashboard, group: 'NAVIGASI' },
]

const groups = Array.from(new Set(nav.map((n) => n.group)))

interface AdminSidebarProps {
  name: string
  email: string
}

export default function AdminSidebar({ name, email }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return false
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
            BACKOFFICE
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
                        layoutId="admin-nav-bg"
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
                      <span className="relative ml-auto w-1.5 h-1.5 rounded-full" style={{ background: palette.ochre }} />
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
