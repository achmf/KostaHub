import { prisma } from '@/lib/prisma'
import { type FarmStatus } from '@prisma/client'

export type SessionData = { id: string; role?: string }

export async function createFarmLogic(data: any, session: SessionData) {
  if (session.role !== 'SUPER_ADMIN') return { error: 'Akses ditolak. Hanya Super Admin.' }
  await prisma.farm.create({
    data: {
      nama: data.nama,
      alamat: data.alamat || null,
      lat: typeof data.lat === 'number' ? data.lat : null,
      lng: typeof data.lng === 'number' ? data.lng : null,
      deskripsi: data.deskripsi || null,
      status: 'AKTIF',
    }
  })
  return { success: true }
}

export async function createAdditionalFarmLogic(data: any, session: SessionData) {
  if (session.role !== 'OWNER') return { error: 'Akses ditolak. Hanya Owner.' }
  await prisma.$transaction(async (tx) => {
    const farm = await tx.farm.create({
      data: {
        nama: data.nama,
        alamat: data.alamat || null,
        lat: typeof data.lat === 'number' ? data.lat : null,
        lng: typeof data.lng === 'number' ? data.lng : null,
        deskripsi: data.deskripsi || null,
        status: 'NONAKTIF',
      }
    })
    await tx.userFarm.create({ data: { userId: session.id, farmId: farm.id } })
  })
  return { success: true, pendingApproval: true }
}

export async function assignUserToFarmLogic(userId: string, farmId: string, session: SessionData) {
  if (session.role !== 'SUPER_ADMIN') return { error: 'Akses ditolak. Hanya Super Admin.' }
  await prisma.userFarm.upsert({
    where: { userId_farmId: { userId, farmId } },
    create: { userId, farmId },
    update: {},
  })
  return { success: true }
}

export async function assignStaffToFarmLogic(staffId: string, farmId: string, session: SessionData) {
  if (session.role !== 'OWNER') return { error: 'Akses ditolak. Hanya Owner.' }
  const ownerMembership = await prisma.userFarm.findUnique({ where: { userId_farmId: { userId: session.id, farmId } } })
  if (!ownerMembership) return { error: 'Akses ditolak: Anda tidak memiliki farm ini' }
  const staff = await prisma.user.findUnique({ where: { id: staffId } })
  if (!staff) return { error: 'Staff tidak ditemukan' }
  if (staff.role !== 'PETUGAS') return { error: 'Hanya PETUGAS yang bisa di-assign ke farm' }
  await prisma.userFarm.upsert({
    where: { userId_farmId: { userId: staffId, farmId } },
    create: { userId: staffId, farmId },
    update: {},
  })
  return { success: true }
}

export async function removeUserFromFarmLogic(userId: string, farmId: string, session: SessionData) {
  if (session.role !== 'SUPER_ADMIN') {
    if (session.role !== 'OWNER') return { error: 'Akses ditolak' }
    const ownerMembership = await prisma.userFarm.findUnique({ where: { userId_farmId: { userId: session.id, farmId } } })
    if (!ownerMembership) return { error: 'Akses ditolak: Bukan farm Anda' }
  }
  await prisma.userFarm.delete({ where: { userId_farmId: { userId, farmId } } })
  return { success: true }
}

export async function updateFarmLogic(id: string, data: any, session: SessionData) {
  if (session.role !== 'SUPER_ADMIN') return { error: 'Akses ditolak. Hanya Super Admin.' }
  await prisma.farm.update({
    where: { id },
    data: {
      nama: data.nama,
      alamat: data.alamat || null,
      lat: typeof data.lat === 'number' ? data.lat : null,
      lng: typeof data.lng === 'number' ? data.lng : null,
      deskripsi: data.deskripsi || null,
      status: (data.status || 'AKTIF') as FarmStatus,
      geojson: data.geojson || null,
    }
  })
  return { success: true }
}

export async function deleteFarmLogic(id: string, session: SessionData) {
  if (session.role !== 'SUPER_ADMIN') return { error: 'Akses ditolak. Hanya Super Admin.' }
  const hewanCount = await prisma.hewan.count({ where: { farmId: id } })
  if (hewanCount > 0) return { error: `Farm masih memiliki ${hewanCount} hewan. Pindahkan dulu sebelum menghapus.` }
  await prisma.farm.delete({ where: { id } })
  return { success: true }
}

export async function getFarmsLogic(session: SessionData) {
  if (session.role === 'SUPER_ADMIN') {
    return prisma.farm.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { hewan: true, members: true } } }
    })
  }
  const userFarms = await prisma.userFarm.findMany({
    where: { userId: session.id },
    include: { farm: { include: { _count: { select: { hewan: true, members: true } } } } },
    orderBy: { assignedAt: 'desc' },
  })
  return userFarms.map(uf => uf.farm)
}

export async function createFarmRegistrationLogic(data: any, sertifikatUrl: string | null, session: SessionData) {
  if (session.role !== 'OWNER') return { error: 'Akses ditolak. Hanya Owner yang dapat mendaftarkan farm.' }
  await prisma.$transaction(async (tx) => {
    const farm = await tx.farm.create({
      data: {
        nama: data.farmNama,
        alamat: data.farmAlamat || null,
        lat: typeof data.farmLat === 'number' ? data.farmLat : null,
        lng: typeof data.farmLng === 'number' ? data.farmLng : null,
        deskripsi: data.farmDeskripsi || null,
        sertifikatUrl,
        status: 'NONAKTIF',
      },
    })
    await tx.userFarm.create({ data: { userId: session.id, farmId: farm.id } })
  })
  return { success: true, pendingApproval: true }
}
