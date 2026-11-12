import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateNotifikasiOtomatis } from '@/lib/notifikasi-generator'

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const farmId = session.activeFarmId

  // Tanpa farm aktif: Super Admin boleh melihat ringkasan lintas farm (read-only), role lain tidak melihat apa pun.
  if (!farmId) {
    if (session.role !== 'SUPER_ADMIN') return NextResponse.json([])
  } else {
    try {
      // shortcut: throttle dari notifikasi terakhir; farm tanpa kandidat tetap jalan tiap poll, ganti ke kolom Farm.notifCheckedAt kalau terasa
      const terakhir = await prisma.notifikasi.findFirst({
        where: { farmId, refKey: { not: null } },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      })
      if (!terakhir || Date.now() - terakhir.createdAt.getTime() > 10 * 60 * 1000) {
        await generateNotifikasiOtomatis(farmId)
      }
    } catch (err) {
      console.error('[Notifikasi] Generator error:', err)
    }
  }

  const notifikasi = await prisma.notifikasi.findMany({
    where: farmId ? { farmId } : {},
    orderBy: { tanggal: 'desc' },
    take: 100,
  })

  // Sort stabil: belum dibaca di atas, urutan tanggal tetap di dalam tiap kelompok
  const hasil = notifikasi.map(({ readBy, ...n }) => ({
    ...n,
    tanggal: n.tanggal.toISOString(),
    isRead: readBy.includes(session.id),
  }))
  hasil.sort((a, b) => Number(a.isRead) - Number(b.isRead))
  return NextResponse.json(hasil)
}
