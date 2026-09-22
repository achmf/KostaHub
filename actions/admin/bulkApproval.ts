'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

async function requireSuperAdmin() {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') {
    throw new Error('Unauthorized')
  }
  return session
}

// ── Bulk Approve Farms ──────────────────────────────────────────────────────
export async function bulkApproveFarms(farmIds: string[]) {
  await requireSuperAdmin()
  if (!farmIds.length) return { error: 'Tidak ada farm yang dipilih' }

  await prisma.farm.updateMany({
    where: { id: { in: farmIds }, status: 'NONAKTIF' },
    data: { status: 'AKTIF', rejectionReason: null },
  })

  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
  return { success: true, count: farmIds.length }
}

// ── Bulk Reject Farms ───────────────────────────────────────────────────────
export async function bulkRejectFarms(farmIds: string[], reason: string) {
  await requireSuperAdmin()
  if (!farmIds.length) return { error: 'Tidak ada farm yang dipilih' }

  await prisma.farm.updateMany({
    where: { id: { in: farmIds }, status: 'NONAKTIF' },
    data: { status: 'NONAKTIF', rejectionReason: reason || 'Ditolak oleh admin.' },
  })

  revalidatePath('/admin/approvals')
  revalidatePath('/admin')
  return { success: true, count: farmIds.length }
}
