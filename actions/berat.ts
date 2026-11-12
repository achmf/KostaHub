'use server'

import { prisma } from '@/lib/prisma'
import { withAuth, withMutationAuth } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { invalidateBerat } from '@/lib/cache-invalidation'

import { redirect } from 'next/navigation'
import { z } from 'zod'

const beratSchema = z.object({
  berat: z.coerce.number({ error: 'Berat tidak valid' }).positive({ message: 'Berat tidak valid' }),
  tanggal: z.coerce.date({ error: 'Tanggal tidak valid' }),
  catatan: z.string().optional(),
})

export const addBeratBadan = withMutationAuth(async (session, formData: FormData) => {
  const hewanId = formData.get('hewanId') as string
  if (!hewanId) return { error: 'Hewan tidak dipilih' }

  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId }, include: { kematian: true } })
  if (!hewan) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) {
    return { error: 'Akses ditolak' }
  }
  if (hewan.kematian) return { error: 'Hewan sudah tercatat mati' }

  const parsed = beratSchema.safeParse({
    berat: formData.get('berat') || undefined,
    tanggal: formData.get('tanggal') || undefined,
    catatan: (formData.get('catatan') as string) || undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { berat, tanggal, catatan } = parsed.data
  if (tanggal > new Date()) return { error: 'Tanggal penimbangan tidak boleh di masa depan' }

  // Hewan.berat = penimbangan bertanggal terbaru, bukan input terakhir (backdate aman)
  await prisma.$transaction(async (tx) => {
    await tx.beratBadan.create({ data: { hewanId, berat, tanggal, catatan: catatan || null } })
    const terbaru = await tx.beratBadan.findFirst({
      where: { hewanId },
      orderBy: [{ tanggal: 'desc' }, { createdAt: 'desc' }],
    })
    await tx.hewan.update({ where: { id: hewanId }, data: { berat: terbaru?.berat ?? berat } })
  })

  invalidateBerat()
  revalidatePath(`/hewan/${hewanId}`)
  redirect('/berat')
})

export const getBeratHistory = withAuth(async (session, hewanId: string) => {
  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!hewan) throw new Error('Hewan tidak ditemukan')
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) {
    throw new Error('Akses ditolak')
  }

  return prisma.beratBadan.findMany({
    where: { hewanId },
    orderBy: { tanggal: 'asc' }
  })
})
