'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Building2, LogOut, ChevronDown, ShieldCheck } from 'lucide-react'
import { logout } from '@/actions/auth'
import { palette } from '@/components/KostaUI'



export interface UserDropdownProps {
  name: string
  email: string
  role: string
  /** Route to the user's profile page. Default: '/profil' */
  profileHref?: string
  /** Show farm selector section (user dashboard only) */
  farmName?: string
  /** Show a role badge instead of farm section (admin only) */
  showRoleBadge?: boolean
}

/**
 * Unified user dropdown used in both user dashboard and admin dashboard.
 * Differences are controlled via props:
 *  - profileHref: '/profil' (default) or '/admin/profil'
 *  - farmName: shows farm selector block (user dashboard)
 *  - showRoleBadge: shows admin role badge block (admin)
 */
export default function UserDropdown({
  name,
  email,
  role,
  profileHref = '/profil',
  farmName,
  showRoleBadge = false,
}: UserDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const isSuperAdmin = role === 'SUPER_ADMIN'

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

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        whileTap={{ scale: 0.97 }}
        className="cursor-pointer flex items-center gap-2 px-3 py-2 rounded-full"
        style={{
          border: `1px solid ${palette.border}`,
          background: open ? 'rgba(13,20,15,0.06)' : '#fff',
          transition: 'background 0.15s ease',
        }}
        aria-expanded={open}
        aria-haspopup="true"
        id="user-dropdown-trigger"
      >
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: palette.ochre,
            color: palette.cream,
            fontFamily: "'Fraunces',serif",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <span
          className="hidden md:block whitespace-nowrap truncate text-left max-w-[120px] lg:max-w-[200px]"
          style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ink }}
        >
          {name}
        </span>
        <ChevronDown
          size={13}
          className="hidden md:block shrink-0"
          style={{
            opacity: 0.5,
            color: palette.ink,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-2 z-50"
            style={{ minWidth: 240 }}
            role="menu"
            aria-labelledby="user-dropdown-trigger"
          >
            <div
              className="rounded-xl overflow-hidden"
              style={{
                background: palette.forest,
                color: palette.cream,
                border: '1px solid rgba(242,237,224,0.12)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)',
              }}
            >
              {/* User info — klik untuk buka profil */}
              <Link
                href={profileHref}
                onClick={() => setOpen(false)}
                className="cursor-pointer px-4 pt-4 pb-3 flex items-center gap-3 rounded-t-xl"
                style={{
                  borderBottom: '1px solid rgba(242,237,224,0.08)',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(242,237,224,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                role="menuitem"
                aria-label="Buka profil saya"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: palette.ochre,
                    color: palette.ink,
                    fontFamily: "'Fraunces',serif",
                    fontSize: 16,
                    fontWeight: 600,
                  }}
                >
                  {name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium truncate" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14 }}>
                    {name}
                  </div>
                  <div className="truncate" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 11, opacity: 0.55 }}>
                    {email}
                  </div>
                </div>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ opacity: 0.35, flexShrink: 0 }}>
                  <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>

              {/* Farm section — user dashboard only */}
              {farmName && role !== 'SUPER_ADMIN' && (
                <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(242,237,224,0.08)' }}>
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded-lg"
                    style={{ background: 'rgba(199,135,62,0.12)', border: '1px solid rgba(199,135,62,0.25)' }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: palette.ochre }} />
                    <span className="truncate text-xs flex-1" style={{ fontFamily: "'Inter',sans-serif", color: palette.ochreSoft }}>
                      {farmName}
                    </span>
                  </div>
                  <Link
                    href="/farms"
                    onClick={() => setOpen(false)}
                    className="cursor-pointer mt-2 w-full flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{ fontFamily: "'Inter',sans-serif", fontSize: 13, color: palette.ochreSoft, transition: 'background 0.12s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(199,135,62,0.10)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                    role="menuitem"
                  >
                    <Building2 size={14} />
                    Ganti Farm
                  </Link>
                </div>
              )}

              {/* Role badge section — admin only */}
              {showRoleBadge && (
                <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid rgba(242,237,224,0.08)' }}>
                  <div
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full"
                    style={{
                      background: isSuperAdmin ? 'rgba(199,135,62,0.18)' : 'rgba(30,120,160,0.18)',
                      border: isSuperAdmin ? '1px solid rgba(199,135,62,0.3)' : '1px solid rgba(30,120,160,0.3)',
                    }}
                  >
                    <ShieldCheck size={10} style={{ color: isSuperAdmin ? palette.ochreSoft : '#7BC4E2' }} />
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, letterSpacing: '0.12em', color: isSuperAdmin ? palette.ochreSoft : '#7BC4E2' }}>
                      {isSuperAdmin ? 'SUPER ADMIN' : 'DINAS'}
                    </span>
                  </div>
                </div>
              )}

              {/* Logout */}
              <div className="px-4 py-3">
                <form action={logout}>
                  <button
                    type="submit"
                    className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 rounded-lg"
                    style={{
                      fontFamily: "'Inter',sans-serif",
                      fontSize: 13,
                      color: palette.cream,
                      opacity: 0.8,
                      background: 'transparent',
                      border: 'none',
                      transition: 'background 0.12s ease, opacity 0.12s ease',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(242,237,224,0.08)'; e.currentTarget.style.opacity = '1' }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.8' }}
                    role="menuitem"
                  >
                    <LogOut size={14} />
                    Keluar
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
