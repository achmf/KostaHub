'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Eye, ArrowLeft } from 'lucide-react'

interface AdminImpersonationBannerProps {
  farmName?: string
  role?: string
}

/**
 * Sticky banner that appears at the very top of the dashboard when a
 * SUPER_ADMIN or DINAS is browsing an owner's farm dashboard.
 * Clearly communicates the context-switch and provides a one-click escape
 * back to the admin backoffice.
 */
export default function AdminImpersonationBanner({ farmName, role }: AdminImpersonationBannerProps) {
  const roleLabel = role === 'DINAS' ? 'DINAS' : 'SUPER ADMIN'
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="w-full flex items-center justify-between gap-3 px-4 sm:px-6 lg:px-10 py-2"
      style={{
        background: 'linear-gradient(90deg, #1B2A1F 0%, #243326 100%)',
        borderBottom: '1px solid rgba(199,135,62,0.25)',
      }}
      role="status"
      aria-live="polite"
      aria-label="Mode pratinjau dashboard owner"
    >
      {/* Left: context info */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full"
          style={{ background: 'rgba(199,135,62,0.2)', border: '1px solid rgba(199,135,62,0.35)' }}
        >
          <Eye size={12} style={{ color: '#E2B883' }} />
        </div>
        <p
          className="truncate"
          style={{
            fontFamily: "'Inter',sans-serif",
            color: 'rgba(242,237,224,0.75)',
            fontSize: 12.5,
          }}
        >
          Anda sedang melihat dashboard{' '}
          {farmName ? (
            <>
              farm{' '}
              <span style={{ color: '#E2B883', fontWeight: 600 }}>
                {farmName}
              </span>{' '}
            </>
          ) : (
            'owner '
          )}
          sebagai{' '}
          <span
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 11,
              letterSpacing: '0.05em',
              color: '#E2B883',
              fontWeight: 600,
            }}
          >
            {roleLabel}
          </span>
          {role === 'DINAS' && (
            <span style={{ fontFamily: "'Inter',sans-serif", fontSize: 11, color: 'rgba(242,237,224,0.45)', marginLeft: 6 }}>
              (Hanya lihat)
            </span>
          )}
        </p>
      </div>

      {/* Right: back button */}
      <Link
        href="/admin"
        className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-150 hover:scale-[1.02] active:scale-[0.98]"
        style={{
          background: 'rgba(199,135,62,0.15)',
          border: '1px solid rgba(199,135,62,0.35)',
          fontFamily: "'Inter',sans-serif",
          fontSize: 12,
          fontWeight: 600,
          color: '#E2B883',
          letterSpacing: '0.01em',
          whiteSpace: 'nowrap',
        }}
        aria-label="Kembali ke dashboard admin backoffice"
      >
        <ArrowLeft size={12} />
        <span>Kembali ke Backoffice</span>
      </Link>
    </motion.div>
  )
}
