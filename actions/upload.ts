'use server'

import { revalidatePath } from 'next/cache'
import { withMutationAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { simpanFile } from '@/lib/storage'
import { invalidateHewan } from '@/lib/cache-invalidation'

/** Upload + pasang foto hewan dalam satu langkah (URL tidak pernah berasal dari browser). */
export const uploadFotoHewan = withMutationAuth(async (session, hewanId: string, formData: FormData): Promise<{ url: string } | { error: string }> => {
  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId }, select: { farmId: true } })
  if (!hewan) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) return { error: 'Akses ditolak' }

  const file = formData.get('file')
  if (!(file instanceof File)) return { error: 'Tidak ada file yang dipilih' }

  const hasil = await simpanFile(file, `hewan/${hewanId}`, { izinkanPdf: false, maksMB: 4 })
  if ('error' in hasil) return hasil

  await prisma.hewan.update({ where: { id: hewanId }, data: { fotoUrl: hasil.url } })
  invalidateHewan()
  revalidatePath(`/hewan/${hewanId}`)
  return hasil
})
