'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'

export async function tandaiSudahDibaca(id: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const notif = await prisma.notifikasi.findUnique({ where: { id } })
  if (!notif) throw new Error('Notifikasi tidak ditemukan')

  if (session.role !== 'SUPER_ADMIN' && notif.farmId !== session.farmId) {
    throw new Error('Akses ditolak')
  }

  await prisma.notifikasi.update({
    where: { id },
    data: { isRead: true }
  })
  redirect('/notifikasi')
}

export async function tambahCustomNotif(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const title = formData.get('title') as string
  const message = formData.get('message') as string
  const tanggal = new Date(formData.get('tanggal') as string)

  const farmId = session.role === 'SUPER_ADMIN' 
    ? (formData.get('farmId') as string || null) 
    : session.farmId

  await prisma.notifikasi.create({
    data: {
      title,
      message,
      tanggal,
      type: 'CUSTOM',
      farmId
    }
  })

  redirect('/notifikasi')
}
