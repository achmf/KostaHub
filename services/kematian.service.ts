import { prisma } from '@/lib/prisma'
import { type PenyebabKematian } from '@prisma/client'
import type { SessionData } from '@/services/hewan.service'

export type CatatKematianData = {
  tanggalMati: Date
  penyebab: PenyebabKematian
  catatan?: string | null
}

/**
 * Catat kematian hewan. Satu hewan hanya bisa mati satu kali (dijaga oleh @unique di DB).
 */
export async function catatKematianLogic(hewanId: string, data: CatatKematianData, session: SessionData) {
  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!hewan) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) return { error: 'Akses ditolak' }

  const existing = await prisma.kematianHewan.findUnique({ where: { hewanId } })
  if (existing) return { error: 'Hewan ini sudah tercatat mati' }

  await prisma.kematianHewan.create({
    data: {
      hewanId,
      tanggalMati: data.tanggalMati,
      penyebab: data.penyebab,
      catatan: data.catatan || null,
    },
  })
  return { success: true }
}

/**
 * Batalkan pencatatan kematian (undo). Hapus record KematianHewan.
 */
export async function batalkanKematianLogic(hewanId: string, session: SessionData) {
  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId } })
  if (!hewan) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) return { error: 'Akses ditolak' }

  const existing = await prisma.kematianHewan.findUnique({ where: { hewanId } })
  if (!existing) return { error: 'Tidak ada catatan kematian untuk hewan ini' }

  await prisma.kematianHewan.delete({ where: { hewanId } })
  return { success: true }
}

/**
 * Hitung jumlah kematian di sebuah farm, dengan filter periode opsional.
 */
export async function countKematianFarm(farmId: string | null, from?: Date, to?: Date) {
  const tanggalFilter = from || to ? {
    tanggalMati: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    },
  } : {}

  return prisma.kematianHewan.count({
    where: {
      ...(farmId ? { hewan: { farmId } } : {}),
      ...tanggalFilter,
    },
  })
}

/**
 * Hitung jumlah hewan yang pernah mati di beberapa farm sekaligus (batch, efisien untuk analytics).
 * Returns map: farmId -> jumlah mati
 */
export async function countKematianPerFarm(farmIds: string[], from?: Date, to?: Date) {
  const tanggalFilter = from || to ? {
    tanggalMati: {
      ...(from ? { gte: from } : {}),
      ...(to ? { lte: to } : {}),
    },
  } : {}

  const results = await prisma.kematianHewan.findMany({
    where: {
      hewan: { farmId: { in: farmIds } },
      ...tanggalFilter,
    },
    select: { hewan: { select: { farmId: true } } },
  })

  const countMap = new Map<string, number>(farmIds.map(id => [id, 0]))
  results.forEach(r => {
    const fid = r.hewan.farmId
    countMap.set(fid, (countMap.get(fid) ?? 0) + 1)
  })
  return countMap
}
