import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { id?: string; all?: boolean }

  if (body.all) {
    // Mark all as read for this farm
    await prisma.notifikasi.updateMany({
      where: session.activeFarmId ? { farmId: session.activeFarmId as string } : {},
      data: { isRead: true },
    })
    return NextResponse.json({ success: true, updated: 'all' })
  }

  if (!body.id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 })
  }

  const notif = await prisma.notifikasi.findUnique({ where: { id: body.id } })
  if (!notif) return NextResponse.json({ error: 'not found' }, { status: 404 })

  if (session.role !== 'SUPER_ADMIN' && notif.farmId !== session.activeFarmId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.notifikasi.update({
    where: { id: body.id },
    data: { isRead: !notif.isRead },
  })

  return NextResponse.json({ success: true, isRead: !notif.isRead })
}
