'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { invalidateAdmin, invalidateFarm } from '@/lib/cache-invalidation'

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

  // Owner melihat hasilnya langsung di halaman /status saat login
  const farm = await prisma.farm.findUnique({ where: { id: farmId }, select: { status: true } })

  if (!farm || farm.status !== 'NONAKTIF') {
    return { error: 'Farm tidak ditemukan atau sudah diproses' }
  }

  await prisma.farm.update({
    where: { id: farmId },
    data: { status: 'AKTIF', rejectionReason: null },
  })

  invalidateAdmin()
  invalidateFarm()
  revalidatePath('/admin/approvals')
  return { success: true }
}

// ── Reject Farm ───────────────────────────────────────────────────────────────
export async function rejectRegistration(farmId: string, reason?: string) {
  await requireSuperAdmin()

  // Alasan penolakan tampil ke owner di halaman /status
  const farm = await prisma.farm.findUnique({ where: { id: farmId }, select: { status: true } })

  if (!farm || farm.status !== 'NONAKTIF') {
    return { error: 'Farm tidak ditemukan atau sudah diproses' }
  }

  await prisma.farm.update({
    where: { id: farmId },
    data: { rejectionReason: reason ?? null },
    // status tetap NONAKTIF — owner bisa reapply
  })

  invalidateAdmin()
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
  invalidateAdmin()
  revalidatePath('/admin/users')
  return { success: true }
}

// ── Create User (by Admin) ─────────────────────────────────────────────────────
export async function createUserByAdmin(formData: FormData): Promise<{ success?: boolean; error?: string }> {
  await requireSuperAdmin()

  const name  = formData.get('name')  as string
  const email = formData.get('email') as string
  const phone = formData.get('phone') as string | null
  const role  = formData.get('role')  as string
  const password = formData.get('password') as string

  if (!name || !email || !password || !role) {
    return { error: 'Semua field wajib diisi' }
  }

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return { error: 'Email sudah terdaftar' }

  const bcrypt = await import('bcryptjs')
  const hashed = await bcrypt.hash(password, 12)

  await prisma.user.create({
    data: { name, email, phone: phone || null, role: role as any, password: hashed, approvalStatus: 'APPROVED' },
  })

  invalidateAdmin()
  revalidatePath('/admin/users')
  return { success: true }
}
