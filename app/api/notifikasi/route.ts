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
      await generateNotifikasiOtomatis(farmId)
    } catch (err) {
      console.error('[Notifikasi] Generator error:', err)
    }
  }

  const notifikasi = await prisma.notifikasi.findMany({
    where: farmId ? { farmId } : {},
    orderBy: [{ isRead: 'asc' }, { tanggal: 'desc' }],
    take: 100,
  })

  return NextResponse.json(
    notifikasi.map((n) => ({ ...n, tanggal: n.tanggal.toISOString() }))
  )
}
