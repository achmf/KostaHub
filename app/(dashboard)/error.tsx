'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { KostaButton, KostaCard } from '@/components/KostaUI'
import { palette } from '@/lib/palette'

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <KostaCard className="max-w-md mx-auto mt-16 p-8 text-center">
      <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 24, color: palette.ink }}>Terjadi kesalahan</h1>
      <p className="mt-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.muted }}>
        Halaman gagal dimuat. Coba lagi, atau kembali ke beranda.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <KostaButton onClick={reset}>Coba lagi</KostaButton>
        <Link href="/" className="inline-flex items-center px-4 py-2.5 text-[13px]" style={{ fontFamily: "'Inter',sans-serif", color: palette.ink }}>
          Ke beranda
        </Link>
      </div>
    </KostaCard>
  )
}
