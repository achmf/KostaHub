'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { sendReapplyNotificationEmail } from '@/lib/email'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

// ── Helper: upload sertifikat farm ──────────────────────────────────────────
async function uploadSertifikat(
  file: File,
  fallbackUrl: string | null
): Promise<string | null> {
  if (!file || file.size === 0) return fallbackUrl
  try {
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const uploadDir = path.join(process.cwd(), 'public/uploads')
    await mkdir(uploadDir, { recursive: true })
    const ext = file.name.split('.').pop() || 'png'
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`
    await writeFile(path.join(uploadDir, fileName), buffer)
    return `/uploads/${fileName}`
  } catch {
    return fallbackUrl
  }
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

  const sertifikatUrl = farmSertifikat
    ? await uploadSertifikat(farmSertifikat, farm.sertifikatUrl)
    : farm.sertifikatUrl

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

  await sendReapplyNotificationEmail(session.name, farmNama)
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

  const sertifikatUrl = farmSertifikat
    ? await uploadSertifikat(farmSertifikat, farm.sertifikatUrl)
    : farm.sertifikatUrl

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

  await sendReapplyNotificationEmail(session.name, farmNama)
  revalidatePath('/farms')

  return { success: true }
}
