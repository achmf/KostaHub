'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

// Legacy action — dipertahankan untuk kompatibilitas,
// tapi mark-read sekarang pakai /api/notifikasi/read
export async function tandaiSudahDibaca(id: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const notif = await prisma.notifikasi.findUnique({ where: { id } })
  if (!notif) throw new Error('Notifikasi tidak ditemukan')

  if (session.role !== 'SUPER_ADMIN' && notif.farmId !== session.activeFarmId) {
    throw new Error('Akses ditolak')
  }

  await prisma.notifikasi.update({
    where: { id },
    data: { isRead: !notif.isRead },
  })
  // Tidak redirect lagi — return saja
}


