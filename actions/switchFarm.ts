'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { encrypt, withAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * Mengganti farm yang sedang aktif di session user.
 * Memvalidasi bahwa user memang memiliki akses ke farm tersebut.
 */
export const switchFarm = withAuth(async (session, farmId: string) => {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    select: { status: true },
  })
  if (!farm || farm.status !== 'AKTIF') {
    throw new Error('Farm belum aktif atau tidak ditemukan')
  }

  // Super Admin dan Dinas (read-only) boleh masuk farm aktif mana pun
  if (session.role !== 'SUPER_ADMIN' && session.role !== 'DINAS') {
    // Validasi: apakah user punya akses ke farm ini?
    const membership = await prisma.userFarm.findUnique({
      where: { userId_farmId: { userId: session.id, farmId } },
    })
    if (!membership) {
      throw new Error('Akses ditolak: Anda tidak memiliki akses ke farm ini')
    }
  }

  // Update session dengan activeFarmId baru
  const newSession = await encrypt({
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    activeFarmId: farmId,
  })

  const cookieStore = await cookies()
  cookieStore.set('session', newSession, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24,
  })

  redirect('/')
})
