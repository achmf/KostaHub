import { NextRequest, NextResponse } from 'next/server'
import { getSession, type SessionPayload } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { KEY_FOTO_HEWAN, KEY_SERTIFIKAT, urlSementara } from '@/lib/storage'

async function anggotaFarm(session: SessionPayload, farmId: string) {
  const m = await prisma.userFarm.findUnique({ where: { userId_farmId: { userId: session.id, farmId } } })
  return Boolean(m)
}

// File di bucket privat: cek hak akses dulu, lalu arahkan ke URL presigned yang berlaku 5 menit.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const key = (await params).key.join('/')
  const url = `/api/files/${key}`
  const notFound = NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 })
  const forbidden = NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })

  const foto = key.match(KEY_FOTO_HEWAN)
  if (foto) {
    const hewan = await prisma.hewan.findUnique({ where: { id: foto[1] }, select: { farmId: true, fotoUrl: true } })
    if (!hewan || hewan.fotoUrl !== url) return notFound // hanya foto yang sedang dipakai
    const boleh = session.role === 'SUPER_ADMIN' || session.role === 'DINAS' || (await anggotaFarm(session, hewan.farmId))
    if (!boleh) return forbidden
  } else if (KEY_SERTIFIKAT.test(key)) {
    const farm = await prisma.farm.findFirst({ where: { sertifikatUrl: url }, select: { id: true } })
    if (!farm) return notFound
    // Dokumen pemilik: hanya Super Admin dan anggota farm itu sendiri
    const boleh = session.role === 'SUPER_ADMIN' || (await anggotaFarm(session, farm.id))
    if (!boleh) return forbidden
  } else {
    return notFound
  }

  const res = NextResponse.redirect(await urlSementara(key), 302)
  res.headers.set('Cache-Control', 'private, max-age=240') // < masa berlaku URL presigned
  return res
}
