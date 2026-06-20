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

// ── Approve Farm ──────────────────────────────────────────────────────────────
export async function approveRegistration(farmId: string) {
  await requireSuperAdmin()

  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        where: { user: { role: 'OWNER' } },
        take: 1,
      },
    },
  })

  if (!farm || farm.status !== 'NONAKTIF') {
    return { error: 'Farm tidak ditemukan atau sudah diproses' }
  }

  await prisma.farm.update({
    where: { id: farmId },
    data: { status: 'AKTIF', rejectionReason: null },
  })

  // Kirim notifikasi ke owner
  const owner = farm.members[0]?.user
  if (owner) {
    await sendApprovalEmail(owner.email, owner.name)
  }

  revalidatePath('/admin/approvals')
  return { success: true }
}

// ── Reject Farm ───────────────────────────────────────────────────────────────
export async function rejectRegistration(farmId: string, reason?: string) {
  await requireSuperAdmin()

  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        where: { user: { role: 'OWNER' } },
        take: 1,
      },
    },
  })

  if (!farm || farm.status !== 'NONAKTIF') {
    return { error: 'Farm tidak ditemukan atau sudah diproses' }
  }

  await prisma.farm.update({
    where: { id: farmId },
    data: { rejectionReason: reason ?? null },
    // status tetap NONAKTIF — owner bisa reapply
  })

  // Kirim notifikasi ke owner
  const owner = farm.members[0]?.user
  if (owner) {
    await sendRejectionEmail(owner.email, owner.name, reason)
  }

  revalidatePath('/admin/approvals')
  return { success: true }
}

// ── Delete User ───────────────────────────────────────────────────────────────
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
