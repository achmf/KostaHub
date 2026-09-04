'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { type FarmStatus } from '@prisma/client'

function requireSuperAdmin(session: { role?: string } | null) {
  if (session?.role !== 'SUPER_ADMIN') {
    throw new Error('Akses ditolak. Hanya Super Admin.')
  }
}

// ── Super Admin: Create Farm (assign ke owner opsional) ──────────────────────
export async function createFarm(formData: FormData) {
  const session = await getSession()
  requireSuperAdmin(session)

  const nama = formData.get('nama') as string
  const alamat = formData.get('alamat') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const deskripsi = formData.get('deskripsi') as string

  if (!nama) return { error: 'Nama farm wajib diisi' }

  await prisma.farm.create({
    data: {
      nama,
      alamat: alamat || null,
      lat: isNaN(lat) ? null : lat,
      lng: isNaN(lng) ? null : lng,
      deskripsi: deskripsi || null,
      status: 'AKTIF',
    }
  })

  revalidatePath('/farm')
  return { success: true }
}

// ── Owner: Tambah Farm Baru (status NONAKTIF, butuh approval) ────────────────
export async function createAdditionalFarm(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'OWNER') {
    return { error: 'Akses ditolak. Hanya Owner.' }
  }

  const nama = formData.get('nama') as string
  const alamat = formData.get('alamat') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const deskripsi = formData.get('deskripsi') as string

  if (!nama) return { error: 'Nama farm wajib diisi' }

  await prisma.$transaction(async (tx) => {
    const farm = await tx.farm.create({
      data: {
        nama,
        alamat: alamat || null,
        lat: isNaN(lat) ? null : lat,
        lng: isNaN(lng) ? null : lng,
        deskripsi: deskripsi || null,
        status: 'NONAKTIF', // perlu approval Super Admin
      }
    })

    // Hubungkan owner ke farm baru
    await tx.userFarm.create({
      data: { userId: session.id, farmId: farm.id },
    })
  })

  revalidatePath('/farms')
  return { success: true, pendingApproval: true }
}

// ── Super Admin: Assign user ke farm ─────────────────────────────────────────
export async function assignUserToFarm(userId: string, farmId: string) {
  const session = await getSession()
  requireSuperAdmin(session)

  // Upsert — jika sudah ada, tidak duplikasi
  await prisma.userFarm.upsert({
    where: { userId_farmId: { userId, farmId } },
    create: { userId, farmId },
    update: {}, // tidak ada yang perlu diupdate
  })

  revalidatePath('/admin/users')
  return { success: true }
}

// ── Owner: Assign Staff ke Farm yang dimiliki owner ──────────────────────────
export async function assignStaffToFarm(staffId: string, farmId: string) {
  const session = await getSession()
  if (!session || session.role !== 'OWNER') {
    return { error: 'Akses ditolak. Hanya Owner.' }
  }

  // Validasi: owner harus punya akses ke farm ini
  const ownerMembership = await prisma.userFarm.findUnique({
    where: { userId_farmId: { userId: session.id, farmId } },
  })
  if (!ownerMembership) {
    return { error: 'Akses ditolak: Anda tidak memiliki farm ini' }
  }

  // Validasi: staff harus sudah terdaftar di sistem
  const staff = await prisma.user.findUnique({ where: { id: staffId } })
  if (!staff) return { error: 'Staff tidak ditemukan' }
  if (!['PETUGAS'].includes(staff.role)) {
    return { error: 'Hanya PETUGAS yang bisa di-assign ke farm' }
  }

  await prisma.userFarm.upsert({
    where: { userId_farmId: { userId: staffId, farmId } },
    create: { userId: staffId, farmId },
    update: {},
  })

  revalidatePath('/staff')
  return { success: true }
}

// ── Remove user dari farm ─────────────────────────────────────────────────────
export async function removeUserFromFarm(userId: string, farmId: string) {
  const session = await getSession()
  if (!session) return { error: 'Unauthorized' }

  // Super Admin bisa remove siapa saja
  if (session.role !== 'SUPER_ADMIN') {
    // Owner hanya bisa remove staff dari farm mereka sendiri
    if (session.role !== 'OWNER') return { error: 'Akses ditolak' }
    
    const ownerMembership = await prisma.userFarm.findUnique({
      where: { userId_farmId: { userId: session.id, farmId } },
    })
    if (!ownerMembership) return { error: 'Akses ditolak: Bukan farm Anda' }
  }

  await prisma.userFarm.delete({
    where: { userId_farmId: { userId, farmId } },
  })

  revalidatePath('/staff')
  return { success: true }
}

export async function updateFarm(id: string, formData: FormData) {
  const session = await getSession()
  requireSuperAdmin(session)

  const nama = formData.get('nama') as string
  const alamat = formData.get('alamat') as string
  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  const deskripsi = formData.get('deskripsi') as string
  const status = formData.get('status') as string
  const geojson = formData.get('geojson') as string

  await prisma.farm.update({
    where: { id },
    data: {
      nama,
      alamat: alamat || null,
      lat: isNaN(lat) ? null : lat,
      lng: isNaN(lng) ? null : lng,
      deskripsi: deskripsi || null,
      status: (status || 'AKTIF') as FarmStatus,
      geojson: geojson || null,
    }
  })

  revalidatePath('/farm')
  revalidatePath(`/farm/${id}`)
  return { success: true }
}

export async function deleteFarm(id: string) {
  const session = await getSession()
  requireSuperAdmin(session)

  const hewanCount = await prisma.hewan.count({ where: { farmId: id } })
  if (hewanCount > 0) {
    return { error: `Farm masih memiliki ${hewanCount} hewan. Pindahkan dulu sebelum menghapus.` }
  }

  await prisma.farm.delete({ where: { id } })
  revalidatePath('/farm')
  return { success: true }
}

export async function getFarms() {
  const session = await getSession()
  if (!session) return []

  if (session.role === 'SUPER_ADMIN') {
    return prisma.farm.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { hewan: true, members: true } }
      }
    })
  }

  // Ambil semua farm yang dimiliki user (via UserFarm)
  const userFarms = await prisma.userFarm.findMany({
    where: { userId: session.id },
    include: {
      farm: {
        include: {
          _count: { select: { hewan: true, members: true } }
        }
      }
    },
    orderBy: { assignedAt: 'desc' },
  })

  return userFarms.map((uf) => uf.farm)
}

// ── Owner: Daftarkan Farm (dari halaman /farms/new) ───────────────────────────
// Berbeda dari createAdditionalFarm: mendukung upload sertifikat (file)
export async function createFarmRegistration(formData: FormData) {
  const session = await getSession()
  if (!session || session.role !== 'OWNER') {
    return { error: 'Akses ditolak. Hanya Owner yang dapat mendaftarkan farm.' }
  }

  const farmNama      = (formData.get('farmNama') as string)?.trim()
  const farmAlamat    = formData.get('farmAlamat') as string
  const farmLat       = formData.get('farmLat') as string
  const farmLng       = formData.get('farmLng') as string
  const farmDeskripsi = formData.get('farmDeskripsi') as string
  const farmSertifikat = formData.get('farmSertifikat') as File | null

  if (!farmNama) return { error: 'Nama farm wajib diisi' }

  let parsedLat: number | null = null
  let parsedLng: number | null = null

  if (farmLat) {
    parsedLat = parseFloat(farmLat)
    if (isNaN(parsedLat)) return { error: 'Latitude farm harus berupa angka' }
  }
  if (farmLng) {
    parsedLng = parseFloat(farmLng)
    if (isNaN(parsedLng)) return { error: 'Longitude farm harus berupa angka' }
  }

  // Handle file upload sertifikat
  let sertifikatUrl: string | null = null
  if (farmSertifikat && farmSertifikat.size > 0) {
    try {
      const { writeFile, mkdir } = await import('fs/promises')
      const path = await import('path')
      const bytes = await farmSertifikat.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const uploadDir = path.join(process.cwd(), 'public/uploads')
      await mkdir(uploadDir, { recursive: true })
      const ext = farmSertifikat.name.split('.').pop() || 'png'
      const fileName = `${Date.now()}-${Math.round(Math.random() * 1000)}.${ext}`
      await writeFile(path.join(uploadDir, fileName), buffer)
      sertifikatUrl = `/uploads/${fileName}`
    } catch (e) {
      console.error('File upload failed', e)
    }
  }

  await prisma.$transaction(async (tx) => {
    const farm = await tx.farm.create({
      data: {
        nama: farmNama,
        alamat: farmAlamat || null,
        lat: parsedLat,
        lng: parsedLng,
        deskripsi: farmDeskripsi || null,
        sertifikatUrl,
        status: 'NONAKTIF', // Menunggu approval Super Admin
      },
    })

    await tx.userFarm.create({
      data: { userId: session.id, farmId: farm.id },
    })
  })

  revalidatePath('/farms')
  return { success: true, pendingApproval: true }
}

