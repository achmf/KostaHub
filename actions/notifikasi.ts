'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { withAuth } from '@/lib/auth'

// Legacy action — dipertahankan untuk kompatibilitas,
// tapi mark-read sekarang pakai /api/notifikasi/read
export const tandaiSudahDibaca = withAuth(async (session, id: string) => {
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
})
