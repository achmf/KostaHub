'use server'

import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { after } from 'next/server'
import { checkInbreeding } from '@/lib/inbreeding'
import { generateNotifikasiOtomatis } from '@/lib/notifikasi-generator'
import { withMutationAuth } from '@/lib/auth'
import { invalidateHewan, invalidateReproduksi } from '@/lib/cache-invalidation'
import { hasilLahirSchema } from '@/lib/validations/reproduksi.schema'

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

export type CatatHasilState = { success: true; jumlahAnak: number } | { error: string }

/**
 * Menutup kehamilan: LAHIR (anak otomatis terdaftar dengan induk & pejantan → silsilah ikut terbentuk)
 * atau GAGAL (keguguran). Hanya untuk status HAMIL.
 */
export const catatHasilReproduksi = withMutationAuth(async (session, reproduksiId: string, formData: FormData): Promise<CatatHasilState> => {
  const repro = await prisma.reproduksi.findUnique({
    where: { id: reproduksiId },
    include: { induk: { select: { farmId: true } } },
  })
  if (!repro) return { error: 'Data kehamilan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && repro.induk.farmId !== session.activeFarmId) return { error: 'Akses ditolak' }
  if (repro.status !== 'HAMIL') return { error: 'Hasil kehamilan ini sudah pernah dicatat' }

  const hasil = formData.get('hasil')
  if (hasil === 'GAGAL') {
    await prisma.reproduksi.update({ where: { id: reproduksiId }, data: { status: 'GAGAL' } })
    invalidateReproduksi()
    revalidatePath('/reproduksi')
    return { success: true, jumlahAnak: 0 }
  }
  if (hasil !== 'LAHIR') return { error: 'Pilih hasil kehamilan: lahir atau gagal' }

  const jumlah = Number(formData.get('jumlahAnak'))
  const parsed = hasilLahirSchema.safeParse({
    tanggalLahir: formData.get('tanggalLahir'),
    anak: Array.from({ length: Number.isInteger(jumlah) ? jumlah : 0 }, (_, i) => ({
      tag: String(formData.get(`tag_${i}`) ?? ''),
      kelamin: formData.get(`kelamin_${i}`),
      berat: String(formData.get(`berat_${i}`) ?? ''),
    })),
  })
  if (!parsed.success) return { error: parsed.error.issues[0].message }
  const { tanggalLahir, anak } = parsed.data

  if (tanggalLahir > new Date()) return { error: 'Tanggal lahir tidak boleh di masa depan' }
  if (tanggalLahir < repro.tanggalKawin) return { error: 'Tanggal lahir tidak boleh sebelum tanggal kawin' }

  const farmId = repro.induk.farmId
  const tags = anak.map((a) => a.tag)
  const bentrok = await prisma.hewan.findMany({ where: { farmId, tag: { in: tags } }, select: { tag: true } })
  if (bentrok.length > 0) return { error: `Tag ${bentrok.map((b) => b.tag).join(', ')} sudah dipakai di farm ini` }

  await prisma.$transaction(async (tx) => {
    const ids: string[] = []
    for (const a of anak) {
      const kid = await tx.hewan.create({
        data: {
          tag: a.tag,
          kelamin: a.kelamin,
          kategori: 'ANAKAN',
          tanggalLahir,
          berat: a.berat ?? null,
          farmId,
          indukId: repro.indukId,
          bapakId: repro.pejantanId,
        },
      })
      if (a.berat !== undefined) {
        await tx.beratBadan.create({ data: { hewanId: kid.id, tanggal: tanggalLahir, berat: a.berat, catatan: 'Berat lahir' } })
      }
      ids.push(kid.id)
    }
    await tx.reproduksi.update({
      where: { id: reproduksiId },
      data: { status: 'LAHIR', anakId: ids[0], anakTag: tags.join(', ') },
    })
  })

  invalidateReproduksi()
  invalidateHewan()
  revalidatePath('/reproduksi')
  return { success: true, jumlahAnak: anak.length }
})
