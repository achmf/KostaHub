import Link from 'next/link'
import { palette } from '@/lib/palette'

export default function NotFound() {
  return (
    <div className="min-h-dvh flex items-center justify-center p-6" style={{ background: palette.cream }}>
      <div className="text-center">
        <h1 style={{ fontFamily: "'Fraunces',serif", fontSize: 28, color: palette.ink }}>Halaman tidak ditemukan</h1>
        <p className="mt-2" style={{ fontFamily: "'Inter',sans-serif", fontSize: 14, color: palette.muted }}>
          Alamat yang Anda buka tidak ada atau sudah dipindahkan.
        </p>
        <Link href="/" className="inline-block mt-6 px-4 py-2.5 rounded-full text-[13px]" style={{ background: palette.ink, color: palette.cream, fontFamily: "'Inter',sans-serif" }}>
          Ke beranda
        </Link>
      </div>
    </div>
  )
}
