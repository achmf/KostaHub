'use server'

import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

function requireSuperAdmin(session: { role?: string } | null) {
  if (session?.role !== 'SUPER_ADMIN') {
    throw new Error('Akses ditolak. Hanya Super Admin.')
  }
}

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
      status: status || 'AKTIF',
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
        _count: { select: { hewan: true, users: true } }
      }
    })
  }

  if (session.farmId) {
    return prisma.farm.findMany({
      where: { id: session.farmId },
      include: {
        _count: { select: { hewan: true, users: true } }
      }
    })
  }

  return []
}
