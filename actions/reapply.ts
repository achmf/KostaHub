'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { simpanFile } from '@/lib/storage'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ── Helper: upload sertifikat farm (tanpa file baru → tetap pakai yang lama) ─
async function uploadSertifikat(
  file: File | null,
  urlLama: string | null
): Promise<{ url: string | null } | { error: string }> {
  if (!file || file.size === 0) return { url: urlLama }
  const hasil = await simpanFile(file, 'sertifikat', { izinkanPdf: true, maksMB: 4 })
  return 'error' in hasil ? { error: `Sertifikat: ${hasil.error}` } : hasil
}

// ── Revisi farm yang ditolak berdasarkan farmId eksplisit ────────────────────
// Digunakan dari /farms/revisi/[farmId] — farmId dikirim di FormData
export async function reapplyFarmById(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role !== 'OWNER') return { error: 'Akses ditolak. Hanya Owner.' }

  const farmId = (formData.get('farmId') as string)?.trim()
  if (!farmId) return { error: 'ID farm tidak valid' }

  // Verifikasi: farm ini milik user ini DAN benar-benar dalam status ditolak
  const userFarm = await prisma.userFarm.findUnique({
    where: { userId_farmId: { userId: session.id, farmId } },
    include: { farm: true },
  })

  if (!userFarm) return { error: 'Farm tidak ditemukan atau bukan milik Anda' }
  // Gunakan explicit null check karena rejectionReason bisa berupa string kosong ""
  if (userFarm.farm.status === 'AKTIF' || userFarm.farm.rejectionReason === null) {
    return { error: 'Farm ini tidak dalam status ditolak' }
  }

  const farm = userFarm.farm

  const farmNama      = (formData.get('farmNama') as string)?.trim()
  const farmAlamat    = (formData.get('farmAlamat') as string)?.trim()
  const farmDeskripsi = (formData.get('farmDeskripsi') as string)?.trim()
  const farmLat       = formData.get('farmLat') as string
  const farmLng       = formData.get('farmLng') as string
  const farmSertifikat = formData.get('farmSertifikat') as File | null

  if (!farmNama) return { error: 'Nama farm wajib diisi' }

  let parsedLat: number | null = farm.lat
  let parsedLng: number | null = farm.lng

  if (farmLat) {
    parsedLat = parseFloat(farmLat)
    if (isNaN(parsedLat)) return { error: 'Latitude harus berupa angka' }
  }
  if (farmLng) {
    parsedLng = parseFloat(farmLng)
    if (isNaN(parsedLng)) return { error: 'Longitude harus berupa angka' }
  }

  const upload = await uploadSertifikat(farmSertifikat, farm.sertifikatUrl)
  if ('error' in upload) return { error: upload.error }
  const sertifikatUrl = upload.url

  // Update farm: reset rejectionReason → kembali ke status pending (menunggu re-review)
  await prisma.farm.update({
    where: { id: farm.id },
    data: {
      nama: farmNama,
      alamat: farmAlamat || null,
      deskripsi: farmDeskripsi || null,
      lat: parsedLat,
      lng: parsedLng,
      sertifikatUrl,
      status: 'NONAKTIF',
      rejectionReason: null, // reset → kembali ke pending review
    },
  })

  revalidatePath('/farms')

  return { success: true }
}

// ── Legacy: revisi berdasarkan query userId (digunakan di /status flow lama) ─
export async function reapplyRegistration(formData: FormData) {
  const session = await getSession()
  if (!session) redirect('/login')

  // Cari farm yang benar-benar ditolak (status NONAKTIF + ada rejectionReason)
  let targetUserFarm = await prisma.userFarm.findFirst({
    where: {
      userId: session.id,
      farm: {
        status: 'NONAKTIF',
        rejectionReason: { not: null },
      },
    },
    include: { farm: true },
    orderBy: { assignedAt: 'desc' },
  })

  // Fallback: farm NONAKTIF tanpa rejectionReason
  if (!targetUserFarm) {
    targetUserFarm = await prisma.userFarm.findFirst({
      where: { userId: session.id, farm: { status: 'NONAKTIF' } },
      include: { farm: true },
      orderBy: { assignedAt: 'desc' },
    })
  }

  if (!targetUserFarm) {
    return { error: 'Tidak ada farm yang bisa diajukan ulang' }
  }

  const farm = targetUserFarm.farm

  const farmNama       = (formData.get('farmNama') as string)?.trim()
  const farmAlamat     = (formData.get('farmAlamat') as string)?.trim()
  const farmDeskripsi  = (formData.get('farmDeskripsi') as string)?.trim()
  const farmLat        = formData.get('farmLat') as string
  const farmLng        = formData.get('farmLng') as string
  const farmSertifikat = formData.get('farmSertifikat') as File | null

  if (!farmNama) {
    return { error: 'Nama farm wajib diisi' }
  }

  let parsedLat: number | null = farm.lat
  let parsedLng: number | null = farm.lng

  if (farmLat) {
    parsedLat = parseFloat(farmLat)
    if (isNaN(parsedLat)) return { error: 'Latitude harus berupa angka' }
  }
  if (farmLng) {
    parsedLng = parseFloat(farmLng)
    if (isNaN(parsedLng)) return { error: 'Longitude harus berupa angka' }
  }

  const upload = await uploadSertifikat(farmSertifikat, farm.sertifikatUrl)
  if ('error' in upload) return { error: upload.error }
  const sertifikatUrl = upload.url

  await prisma.farm.update({
    where: { id: farm.id },
    data: {
      nama: farmNama,
      alamat: farmAlamat || null,
      deskripsi: farmDeskripsi || null,
      lat: parsedLat,
      lng: parsedLng,
      sertifikatUrl,
      status: 'NONAKTIF',
      rejectionReason: null,
    },
  })

  revalidatePath('/farms')

  return { success: true }
}
