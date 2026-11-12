import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CACHE_TAGS } from '@/lib/cached-queries'

// updateTag hanya boleh dari Server Action, jadi route handler memakai revalidateTag (expire langsung)
function invalidateNotifikasiRoute() {
  revalidateTag(CACHE_TAGS.notifikasi, { expire: 0 })
  revalidateTag(CACHE_TAGS.dashboard, { expire: 0 })
}

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as { id?: string; all?: boolean }

  if (body.all) {
    // Hanya farm aktif — tanpa farm aktif tidak ada yang boleh ditandai massal
    if (!session.activeFarmId) {
      return NextResponse.json({ error: 'Pilih farm terlebih dahulu' }, { status: 400 })
    }
    await prisma.$executeRaw`UPDATE "Notifikasi" SET "readBy" = array_append(COALESCE("readBy", '{}'), ${session.id}) WHERE "farmId" = ${session.activeFarmId} AND NOT (${session.id} = ANY(COALESCE("readBy", '{}')))`
    invalidateNotifikasiRoute()
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

  // Atomik di DB supaya dua user yang menandai bersamaan tidak saling menimpa
  const sudahBaca = notif.readBy.includes(session.id)
  if (sudahBaca) {
    await prisma.$executeRaw`UPDATE "Notifikasi" SET "readBy" = array_remove("readBy", ${session.id}) WHERE id = ${body.id}`
  } else {
    await prisma.notifikasi.update({ where: { id: body.id }, data: { readBy: { push: session.id } } })
  }
  invalidateNotifikasiRoute()

  return NextResponse.json({ success: true, isRead: !sudahBaca })
}
