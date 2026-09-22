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
  // Super Admin boleh akses semua farm
  if (session.role !== 'SUPER_ADMIN') {
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
