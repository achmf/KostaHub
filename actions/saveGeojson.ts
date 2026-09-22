'use server'

import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Save GeoJSON polygon for a farm.
 * Only the OWNER of the farm can save polygon data.
 */
export async function saveGeojson(farmId: string, geojson: string | null) {
  const session = await getSession()
  if (!session) return { error: 'Tidak terautentikasi' }
  if (session.role !== 'OWNER') return { error: 'Hanya pemilik farm yang bisa mengatur area kandang' }

  // Validate ownership via UserFarm relation
  const userFarm = await prisma.userFarm.findUnique({
    where: { userId_farmId: { userId: session.id, farmId } },
  })
  if (!userFarm) return { error: 'Farm tidak ditemukan atau bukan milik Anda' }

  // Validate GeoJSON if provided
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

  revalidatePath('/map')
  return { success: true }
}
