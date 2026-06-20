'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'
import { revalidatePath } from 'next/cache'

async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized')
  }
  return session
}

// ── Change User Role ────────────────────────────────────────────────────────
export async function changeUserRole(userId: string, newRole: Role) {
  const session = await requireSuperAdmin()

  // Prevent admin from changing their own role
  if (userId === session.id) {
    return { error: 'Anda tidak dapat mengubah role akun Anda sendiri' }
  }

  const validRoles: Role[] = ['OWNER', 'PETUGAS', 'DOKTER']
  if (!validRoles.includes(newRole)) {
    return { error: 'Role tidak valid. Pilih OWNER, PETUGAS, atau DOKTER.' }
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user || user.deletedAt) {
    return { error: 'User tidak ditemukan' }
  }
  if (user.role === 'SUPER_ADMIN') {
    return { error: 'Role SUPER_ADMIN tidak dapat diubah' }
  }

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  })

  revalidatePath('/admin/users')
  return { success: true }
}
