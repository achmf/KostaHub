'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'
import { type Role } from '@prisma/client'
import { createStaffSchema } from '@/lib/validations/auth.schema'

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

  const parsed = createStaffSchema.safeParse({ name, email, password })
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message }
  }

  const farmId = session.activeFarmId!
  const existingUser = await prisma.user.findUnique({
    where: { email },
    include: { farms: { select: { farmId: true } } },
  })
  if (existingUser) {
    // Sengaja tidak melampirkan user aktif yang sudah ada: mencegah pengambilalihan akun lintas farm.
    // Aturan: PETUGAS terhapus boleh diaktifkan lagi hanya jika SEMUA baris UserFarm-nya milik farm aktif
    // (nol baris juga boleh; deleteStaff lama menyisakan baris UserFarm). Punya farm lain atau masih aktif -> ditolak.
    if (
      existingUser.role !== 'PETUGAS' ||
      !existingUser.deletedAt ||
      existingUser.farms.some((f) => f.farmId !== farmId)
    ) {
      return { error: 'Email sudah terdaftar' }
    }

    const hashed = await bcrypt.hash(password, 10)
    try {
      const direaktivasi = await prisma.$transaction(async (tx) => {
        // Update bersyarat: Postgres mengecek ulang deletedAt setelah baris dikunci, jadi dari dua owner
        // yang mengaktifkan user yang sama bersamaan hanya satu yang berhasil (yang kedua dapat count 0).
        const { count } = await tx.user.updateMany({
          where: {
            id: existingUser.id,
            role: 'PETUGAS',
            deletedAt: { not: null },
            farms: { every: { farmId } },
          },
          data: { deletedAt: null, password: hashed, name, phone: phone || null, failedLogins: 0, lockedUntil: null },
        })
        if (count === 0) return false
        await tx.userFarm.upsert({
          where: { userId_farmId: { userId: existingUser.id, farmId } },
          create: { userId: existingUser.id, farmId },
          update: {},
        })
        return true
      })
      if (!direaktivasi) return { error: 'Email sudah terdaftar' }
    } catch (e) {
      if ((e as { code?: string }).code === 'P2002') return { error: 'Staff sudah terdaftar di farm ini' }
      throw e
    }
    revalidatePath('/staff')
    return { success: true }
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

  // Lepas dari farm aktif saja; soft-delete user hanya jika tidak punya farm lain
  await prisma.$transaction(async (tx) => {
    await tx.userFarm.delete({
      where: { userId_farmId: { userId: staffId, farmId: session.activeFarmId! } },
    })
    if (staff.farms.length <= 1) {
      await tx.user.update({ where: { id: staffId }, data: { deletedAt: new Date() } })
    }
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

  if (staff.role !== 'PETUGAS') return { error: 'Hanya bisa mengubah PETUGAS' }
  if (staff.farms.some((uf) => uf.farmId !== session.activeFarmId)) {
    return { error: 'Staff juga terdaftar di farm lain; data akun tidak bisa diubah dari sini' }
  }

  const updateData: any = { name, phone: phone || null }

  if (password) {
    if (password.length < 6) return { error: 'Password minimal 6 karakter' }
    updateData.password = await bcrypt.hash(password, 10)
  }

  await prisma.user.update({
    where: { id: staffId },
    data: updateData,
  })

  revalidatePath('/staff')
  return { success: true }
}
