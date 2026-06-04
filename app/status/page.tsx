'use client'

import { motion } from 'framer-motion'
import { GoatMark } from '@/components/GoatMark'
import { Clock, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

const palette = {
  cream: '#F2EDE0',
  forest: '#1B2A1F',
  ink: '#0D140F',
  ochre: '#C7873E',
  border: 'rgba(13,20,15,0.12)',
  moss: '#3F5B3A',
}

export default function StatusPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: palette.cream }}>
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.06 }}
      >
        {[...Array(10)].map((_, i) => (
          <path
            key={i}
            d={`M0 ${10 + i * 9} Q 25 ${8 + i * 9 + (i % 2 ? 5 : -3)}, 50 ${10 + i * 9} T 100 ${10 + i * 9}`}
            stroke={palette.moss}
            strokeWidth="0.4"
            fill="none"
          />
        ))}
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-[480px] rounded-3xl overflow-hidden"
        style={{ background: '#fff', border: `1px solid ${palette.border}` }}
      >
        <div className="px-8 pt-8 pb-10" style={{ background: palette.forest, color: palette.cream }}>
          <div className="flex items-center gap-3 mb-5">
            <GoatMark className="w-7 h-7" />
            <span style={{ fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: 18 }}>KostaHub</span>
          </div>
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-5"
            style={{
              background: 'rgba(199,135,62,0.2)',
              color: palette.ochre,
              fontFamily: "'JetBrains Mono',monospace",
              fontSize: 10,
              letterSpacing: '0.15em',
            }}
          >
            <Clock size={12} />
            MENUNGGU VERIFIKASI
          </div>
          <h1
            className="tracking-[-0.025em]"
            style={{
              fontFamily: "'Fraunces',serif",
              fontSize: 'clamp(1.6rem, 3.5vw, 2.2rem)',
              lineHeight: 1.1,
              fontWeight: 400,
            }}
          >
            Pendaftaran Anda sedang <span style={{ fontStyle: 'italic', color: palette.ochre }}>ditinjau.</span>
          </h1>
        </div>

        <div className="px-8 py-8">
          <div className="space-y-4" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: 'rgba(13,20,15,0.7)', lineHeight: 1.7 }}>
            <p>
              Tim admin pusat sedang meninjau data farm Anda. Proses verifikasi biasanya memakan waktu <strong style={{ color: palette.ink }}>1-3 hari kerja</strong>.
            </p>
            <div
              className="p-4 rounded-xl"
              style={{ background: 'rgba(13,20,15,0.03)', border: `1px solid ${palette.border}` }}
            >
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '0.15em', color: 'rgba(13,20,15,0.4)', marginBottom: 8 }}>
                YANG SEDANG KAMI PERIKSA
              </div>
              <ul className="space-y-2" style={{ fontSize: 13 }}>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: palette.ochre }} />
                  Validitas data farm yang didaftarkan
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: palette.ochre }} />
                  Kelengkapan informasi pemilik
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: palette.ochre }} />
                  Sertifikat farm (jika dilampirkan)
                </li>
              </ul>
            </div>
          </div>

          <Link
            href="/login"
            className="mt-6 w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full"
            style={{
              background: palette.ink,
              color: palette.cream,
              fontFamily: "'Inter',sans-serif",
              fontSize: 14,
            }}
          >
            Kembali ke Login
            <ArrowUpRight size={14} />
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
