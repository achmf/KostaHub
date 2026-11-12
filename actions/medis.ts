'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { withMutationAuth } from '@/lib/auth'
import { invalidateMedis } from '@/lib/cache-invalidation'
import { generateNotifikasiOtomatis } from '@/lib/notifikasi-generator'
import { medisSchema } from '@/lib/validations/medis.schema'

export const tambahRekamMedis = withMutationAuth(async (session, formData: FormData) => {
  const hewanId = formData.get('hewanId') as string
  if (!hewanId) return { error: 'Hewan tidak dipilih' }

  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId }, include: { kematian: true } })
  if (!hewan) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) {
    return { error: 'Akses ditolak' }
  }
  if (hewan.kematian) return { error: 'Hewan sudah tercatat mati' }

  const butuhNotifikasiStr = formData.get('butuhNotifikasi')
  const butuhNotifikasi = butuhNotifikasiStr === 'on' || butuhNotifikasiStr === 'true'
  const parsed = medisSchema.safeParse({
    tanggal: formData.get('tanggal') || undefined,
    kategori: formData.get('kategori') || undefined,
    diagnosis: formData.get('diagnosis') ?? '',
    tanggalLanjut: butuhNotifikasi ? formData.get('tanggalLanjut') || undefined : undefined,
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { tanggal, kategori, diagnosis, tanggalLanjut = null } = parsed.data

  const obatKategori = formData.get('obat_kategori') as string
  const obatCustom = formData.get('obat_custom') as string
  let obat: string | null = obatKategori === 'LAINNYA' ? obatCustom : (obatKategori || null)
  if (obat === 'NONE' || obat === 'TIDAK_ADA') obat = null

  const notes = formData.get('notes') as string
  const dokter = formData.get('dokter') as string

  await prisma.rekamMedis.create({
    data: {
      hewanId,
      tanggal,
      kategori,
      diagnosis,
      obat,
      notes: notes || null,
      namaDokter: dokter || null,
      butuhNotifikasi,
      tanggalLanjut,
    }
  })

  // Jadwal kontrol dalam 3 hari → notifikasi + push langsung, tidak menunggu polling/cron
  if (tanggalLanjut) after(() => generateNotifikasiOtomatis(hewan.farmId))

  invalidateMedis()
  redirect('/medis')
})

export const hapusRekamMedis = withMutationAuth(async (session, id: string) => {
  const rec = await prisma.rekamMedis.findUnique({
    where: { id },
    include: { hewan: { select: { farmId: true } } },
  })
  if (!rec) return { error: 'Rekam medis tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && rec.hewan.farmId !== session.activeFarmId) {
    return { error: 'Akses ditolak' }
  }

  await prisma.rekamMedis.delete({ where: { id } })

  invalidateMedis()
  revalidatePath('/medis')
  revalidatePath(`/medis/${rec.hewanId}`)
  revalidatePath(`/hewan/${rec.hewanId}`)
  return { success: true as const }
})
