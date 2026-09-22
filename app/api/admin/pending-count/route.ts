import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ count: 0 })
  }

  const count = await prisma.farm.count({
    where: { status: 'NONAKTIF', deletedAt: null, rejectionReason: null },
  })

  return NextResponse.json({ count }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
