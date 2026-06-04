'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

import { redirect } from 'next/navigation'

export async function addBeratBadan(formData: FormData) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const hewanId = formData.get('hewanId') as string
  if (!hewanId) return { error: 'Hewan tidak dipilih' }

  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!hewan) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.farmId) {
    return { error: 'Akses ditolak' }
  }

  const berat = parseFloat(formData.get('berat') as string)
  const tanggal = new Date(formData.get('tanggal') as string)
  const catatan = formData.get('catatan') as string

  if (isNaN(berat) || berat <= 0) return { error: 'Berat tidak valid' }

  await prisma.beratBadan.create({
    data: { hewanId, berat, tanggal, catatan: catatan || null }
  })

  // Update berat terkini di hewan
  await prisma.hewan.update({
    where: { id: hewanId },
    data: { berat }
  })

  revalidatePath(`/hewan/${hewanId}`)
  redirect('/berat')
}

export async function getBeratHistory(hewanId: string) {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!hewan) throw new Error('Hewan tidak ditemukan')
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.farmId) {
    throw new Error('Akses ditolak')
  }

  return prisma.beratBadan.findMany({
    where: { hewanId },
    orderBy: { tanggal: 'asc' }
  })
}
