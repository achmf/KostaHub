'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Save GeoJSON polygon for ANY farm.
 * Only SUPER_ADMIN can use this action — no ownership check.
 */
export async function saveGeojsonAdmin(farmId: string, geojson: string | null) {
  const session = await getSession()
  if (!session) return { error: 'Tidak terautentikasi' }
  if (session.role !== 'SUPER_ADMIN') return { error: 'Akses ditolak. Hanya Super Admin.' }

  // Validate farm exists
  const farm = await prisma.farm.findUnique({ where: { id: farmId }, select: { id: true } })
  if (!farm) return { error: 'Farm tidak ditemukan' }

  // Validate GeoJSON structure if provided
  if (geojson !== null) {
    try {
      const parsed = JSON.parse(geojson)
      if (!parsed.type) throw new Error('Invalid GeoJSON')
    } catch {
      return { error: 'Format GeoJSON tidak valid' }
    }
  }

  await prisma.farm.update({
    where: { id: farmId },
    data: { geojson },
  })

  revalidatePath('/admin/map')
  return { success: true }
}
