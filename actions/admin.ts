'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized')
  }
  return session
}

export async function approveRegistration(userId: string) {
  await requireSuperAdmin()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.approvalStatus !== 'PENDING') {
    return { error: 'User tidak ditemukan atau sudah diproses' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: 'APPROVED' },
    }),
    prisma.farm.update({
      where: { id: user.farmId! },
      data: { status: 'AKTIF' },
    }),
  ])

  await sendApprovalEmail(user.email, user.name)

  revalidatePath('/admin/approvals')
  return { success: true }
}

export async function rejectRegistration(userId: string) {
  await requireSuperAdmin()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.approvalStatus !== 'PENDING') {
    return { error: 'User tidak ditemukan atau sudah diproses' }
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { approvalStatus: 'REJECTED', deletedAt: new Date() },
    }),
    prisma.farm.update({
      where: { id: user.farmId! },
      data: { status: 'DELETED', deletedAt: new Date() },
    }),
  ])

  await sendRejectionEmail(user.email, user.name)

  revalidatePath('/admin/approvals')
  return { success: true }
}

export async function deleteUser(userId: string) {
  await requireSuperAdmin()

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: 'User tidak ditemukan' }
  if (user.role === 'SUPER_ADMIN') return { error: 'Tidak bisa hapus Super Admin' }

  await prisma.user.update({
    where: { id: userId },
    data: { deletedAt: new Date() },
  })
  revalidatePath('/admin/users')
  return { success: true }
}
