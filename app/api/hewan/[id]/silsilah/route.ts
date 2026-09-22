import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { buildSilsilahTree } from '@/lib/silsilah'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession()
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Verifikasi hewan ada
    const hewan = await prisma.hewan.findUnique({ where: { id }, select: { id: true, farmId: true } })
    if (!hewan) return NextResponse.json({ error: 'Hewan tidak ditemukan' }, { status: 404 })

    // Farm access control
    if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const tree = await buildSilsilahTree(id)
    return NextResponse.json({ tree })
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil data silsilah' }, { status: 500 })
  }
}
