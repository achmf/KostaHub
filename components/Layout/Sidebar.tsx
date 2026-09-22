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
  PanelLeftClose,
  PanelLeftOpen,
  X,
} from 'lucide-react'
import { GoatMark } from '@/components/GoatMark'
import { logout } from '@/actions/auth'
import { palette } from '@/components/KostaUI'
import { useMobileMenu } from './MobileMenuContext'



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
  { href: '/laporan', label: 'Laporan', icon: FileBarChart, group: 'ANALITIK', roles: ['OWNER', 'SUPER_ADMIN'] },
  { href: '/map', label: 'Peta GIS', icon: Map, group: 'ANALITIK', roles: ['OWNER', 'SUPER_ADMIN'] },
  { href: '/staff', label: 'Kelola Staff', icon: Users2, group: 'MANAJEMEN', roles: ['OWNER'] },
  { href: '/farm', label: 'Manajemen Farm', icon: Building2, group: 'ADMIN', roles: ['SUPER_ADMIN'] },
  { href: '/admin', label: 'Backoffice', icon: Shield, group: 'ADMIN', roles: ['SUPER_ADMIN', 'DINAS'] },
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
  const nav = allNav.filter((n) => !n.roles || n.roles.includes(role))
  const groups = Array.from(new Set(nav.map((n) => n.group)))

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const [isOpen, setIsOpen] = useState(true)
  const { isOpen: isMobileOpen, setIsOpen: setIsMobileOpen } = useMobileMenu()
  // Drawer mobile selalu lebar penuh; mode ciut hanya berlaku di desktop
  const expanded = isMobileOpen || isOpen

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        animate={{ width: expanded ? 260 : 72 }}
        transition={{ type: 'spring', stiffness: 400, damping: 40 }}
        className={`flex flex-col shrink-0 left-0 top-0 h-dvh z-50 overflow-hidden transition-[translate,visibility] duration-300 ease-out fixed lg:sticky max-w-[85vw] ${isMobileOpen ? 'translate-x-0 visible shadow-2xl' : '-translate-x-full invisible lg:visible lg:translate-x-0'}`}
        aria-label="Navigasi utama"
        style={{ background: palette.forest, color: palette.cream }}
      >
      {/* Brand */}
      <div className={`pt-5 pb-6 lg:pt-7 lg:pb-8 flex items-center ${expanded ? 'px-6 gap-2.5' : 'justify-center px-0'}`}>
        <GoatMark className="w-7 h-7 shrink-0" />
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}
            >
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
              {farmName && (
                <div className="lg:hidden truncate max-w-[150px]" style={{ fontFamily: "'Inter',sans-serif", fontSize: 12, color: palette.ochreSoft }}>
                  {farmName}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden ml-auto -mr-2 w-10 h-10 shrink-0 flex items-center justify-center rounded-full hover:bg-white/10 active:bg-white/15 transition-colors"
          aria-label="Tutup menu"
        >
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="px-3 flex-1 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
        {groups.map((g) => {
          const groupNavs = nav.filter((n) => n.group === g)
          if (groupNavs.length === 0) return null

          return (
            <div key={g} className="mb-6">
              <AnimatePresence mode="wait">
                {expanded ? (
                  <motion.div
                    key="open-group"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="px-3 mb-2"
                    style={{
                      fontFamily: "'JetBrains Mono',monospace",
                      fontSize: 10,
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
                    className="mb-2 text-center"
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
                const active = isActive(n.href)
                const Icon = n.icon
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    className={`cursor-pointer relative flex items-center py-3 lg:py-2.5 rounded-md mb-0.5 hover:bg-white/5 transition-all duration-200 ${
                      expanded ? 'px-3 gap-3 w-full text-left' : 'justify-center mx-auto w-10 h-10 px-0'
                    }`}
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 13.5 }}
                    title={!expanded ? n.label : undefined}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => {
                      if (isMobileOpen) setIsMobileOpen(false)
                    }}
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
                      size={17}
                      className="relative shrink-0"
                      style={{
                        opacity: active ? 1 : 0.7,
                        color: active ? palette.ochreSoft : palette.cream,
                      }}
                    />
                    <AnimatePresence>
                      {expanded && (
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

                    {active && expanded && (
                      <span
                        className="relative ml-auto shrink-0 w-1.5 h-1.5 rounded-full"
                        style={{ background: palette.ochre }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* Footer Toggle */}
      <div className="p-3 mt-auto hidden lg:block" style={{ borderTop: '1px solid rgba(242,237,224,0.05)' }}>
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
    </>
  )
}
