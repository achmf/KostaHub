'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { checkInbreeding } from '@/lib/inbreeding'
import { getSession } from '@/lib/auth'

export type TambahReproduksiState = {
  warning?: boolean
  sharedAncestors?: { id: string; tag: string; nama: string | null; kelamin: string }[]
  error?: string
} | null

export async function tambahReproduksi(formData: FormData): Promise<TambahReproduksiState> {
  const session = await getSession()
  if (!session) throw new Error('Unauthorized')

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

  // Buat notifikasi H-7 sebelum estimasi lahir
  const notifHmin7 = new Date(estimasiLahir)
  notifHmin7.setDate(notifHmin7.getDate() - 7)

  await prisma.notifikasi.create({
    data: {
      title: 'Estimasi Kelahiran Mendekat (H-7)',
      message: `Induk perlu persiapan melahirkan pada ${estimasiLahir.toLocaleDateString()}`,
      tanggal: notifHmin7,
      type: 'LAHIR',
    }
  })

  redirect('/reproduksi')
}
