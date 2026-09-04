'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { type Role } from '@prisma/client'

async function requireOwnerWithFarm() {
  const session = await getSession()
  if (!session || session.role !== 'OWNER') {
    throw new Error('Unauthorized')
  }
  if (!session.activeFarmId) {
    throw new Error('Pilih farm aktif terlebih dahulu')
  }
  return session
}

export async function createStaff(formData: FormData) {
  const session = await requireOwnerWithFarm()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const phone = formData.get('phone') as string

  if (!name || !email || !password || !role) {
    return { error: 'Nama, email, password, dan role wajib diisi' }
  }

  if (!['PETUGAS'].includes(role)) {
    return { error: 'Role harus PETUGAS' }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: 'Email sudah terdaftar' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.$transaction(async (tx) => {
    // Buat user staff
    const staff = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role as Role,
        phone: phone || null,
        approvalStatus: 'APPROVED',
      },
    })

    // Hubungkan staff ke farm aktif owner via UserFarm
    await tx.userFarm.create({
      data: { userId: staff.id, farmId: session.activeFarmId! },
    })
  })

  revalidatePath('/staff')
  return { success: true }
}

export async function deleteStaff(staffId: string) {
  const session = await requireOwnerWithFarm()

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    include: { farms: true },
  })
  if (!staff) return { error: 'Staff tidak ditemukan' }

  // Pastikan staff ini memang terhubung ke farm aktif owner
  const isMemberOfActiveFarm = staff.farms.some(
    (uf) => uf.farmId === session.activeFarmId
  )
  if (!isMemberOfActiveFarm) {
    return { error: 'Bukan staff farm Anda' }
  }

  if (!['PETUGAS'].includes(staff.role)) {
    return { error: 'Hanya bisa menghapus PETUGAS' }
  }

  await prisma.user.update({
    where: { id: staffId },
    data: { deletedAt: new Date() },
  })

  revalidatePath('/staff')
  return { success: true }
}

export async function updateStaff(staffId: string, formData: FormData) {
  const session = await requireOwnerWithFarm()
  
  const name = formData.get('name') as string
  const phone = formData.get('phone') as string
  const password = formData.get('password') as string

  if (!name) {
    return { error: 'Nama wajib diisi' }
  }

  const staff = await prisma.user.findUnique({
    where: { id: staffId },
    include: { farms: true },
  })
  if (!staff) return { error: 'Staff tidak ditemukan' }

  const isMemberOfActiveFarm = staff.farms.some(
    (uf) => uf.farmId === session.activeFarmId
  )
  if (!isMemberOfActiveFarm) return { error: 'Bukan staff farm Anda' }

  let updateData: any = { name, phone: phone || null }
  
  if (password && password.length >= 6) {
    updateData.password = await bcrypt.hash(password, 10)
  }

  await prisma.user.update({
    where: { id: staffId },
    data: updateData,
  })

  revalidatePath('/staff')
  return { success: true }
}
