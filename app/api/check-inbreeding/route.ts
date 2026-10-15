import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkInbreeding } from '@/lib/inbreeding'

export async function POST(req: NextRequest) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { indukId, pejantanId } = await req.json()

    if (!indukId || !pejantanId) {
      return NextResponse.json({ error: 'indukId dan pejantanId wajib diisi' }, { status: 400 })
    }

    // Kedua hewan harus berada di farm aktif (Super Admin bebas), agar silsilah farm lain tidak bocor
    if (session.role !== 'SUPER_ADMIN') {
      const count = await prisma.hewan.count({ where: { id: { in: [indukId, pejantanId] }, farmId: session.activeFarmId ?? '' } })
      if (count !== 2) return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const result = await checkInbreeding(indukId, pejantanId)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Gagal memeriksa silsilah' }, { status: 500 })
  }
}
