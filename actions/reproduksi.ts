'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { checkInbreeding } from '@/lib/inbreeding'
import { generateNotifikasiOtomatis } from '@/lib/notifikasi-generator'
import { withMutationAuth } from '@/lib/auth'
import { invalidateReproduksi } from '@/lib/cache-invalidation'

export type TambahReproduksiState = {
  warning?: boolean
  sharedAncestors?: { id: string; tag: string; nama: string | null; kelamin: string }[]
  error?: string
} | null

export const tambahReproduksi = withMutationAuth(async (session, formData: FormData): Promise<TambahReproduksiState> => {
  const indukId = formData.get('indukId') as string
  if (!indukId) return { error: 'Induk tidak dipilih' }

  const induk = await prisma.hewan.findUnique({ where: { id: indukId } })
  if (!induk) return { error: 'Induk tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && induk.farmId !== session.activeFarmId) {
    return { error: 'Akses ditolak' }
  }
  const pejantanId = formData.get('pejantanId') as string
  const tanggalKawin = new Date(formData.get('tanggalKawin') as string)
  const forceSubmit = formData.get('forceSubmit') === 'true'

  // Estimasi lahir = +150 hari
  const estimasiLahir = new Date(tanggalKawin)
  estimasiLahir.setDate(estimasiLahir.getDate() + 150)

  // Cek inbreeding jika bukan force submit
  if (!forceSubmit) {
    const inbreedingResult = await checkInbreeding(indukId, pejantanId)
    if (inbreedingResult.isRisk) {
      return {
        warning: true,
        sharedAncestors: inbreedingResult.sharedAncestors,
      }
    }
  }

  await prisma.reproduksi.create({
    data: {
      indukId,
      pejantanId,
      tanggalKawin,
      estimasiLahir,
      status: 'HAMIL',
      inbreedingWarning: forceSubmit,
    }
  })

  // Notifikasi H-7 dibuat generator; jalankan sekarang supaya push langsung terkirim jika sudah dekat
  after(() => generateNotifikasiOtomatis(induk.farmId))

  invalidateReproduksi()
  redirect('/reproduksi')
})
