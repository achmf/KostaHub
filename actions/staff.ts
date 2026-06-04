'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { revalidatePath } from 'next/cache'

async function requireOwner() {
  const session = await getSession()
  if (!session || session.role !== 'OWNER') {
    throw new Error('Unauthorized')
  }
  if (!session.farmId) {
    throw new Error('Owner tidak memiliki farm')
  }
  return session
}

export async function createStaff(formData: FormData) {
  const session = await requireOwner()

  const name = formData.get('name') as string
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const role = formData.get('role') as string
  const phone = formData.get('phone') as string

  if (!name || !email || !password || !role) {
    return { error: 'Nama, email, password, dan role wajib diisi' }
  }

  if (!['PETUGAS', 'DOKTER'].includes(role)) {
    return { error: 'Role harus PETUGAS atau DOKTER' }
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: 'Email sudah terdaftar' }
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role,
      phone: phone || null,
      approvalStatus: 'APPROVED',
      farmId: session.farmId,
    },
  })

  revalidatePath('/')
  return { success: true }
}

export async function deleteStaff(staffId: string) {
  const session = await requireOwner()

  const staff = await prisma.user.findUnique({ where: { id: staffId } })
  if (!staff) return { error: 'Staff tidak ditemukan' }
  if (staff.farmId !== session.farmId) return { error: 'Bukan staff farm Anda' }
  if (!['PETUGAS', 'DOKTER'].includes(staff.role)) {
    return { error: 'Hanya bisa menghapus PETUGAS atau DOKTER' }
  }

  await prisma.user.delete({ where: { id: staffId } })
  revalidatePath('/')
  return { success: true }
}
