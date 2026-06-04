import { prisma } from '@/lib/prisma'
import { getAncestorIds } from '@/lib/silsilah'

export type SharedAncestor = {
  id: string
  tag: string
  nama: string | null
  kelamin: string
}

export type InbreedingCheckResult = {
  isRisk: boolean
  sharedAncestors: SharedAncestor[]
}

/**
 * Memeriksa potensi kawin sedarah antara induk dan pejantan.
 * Mengambil semua leluhur kedua hewan (tidak terbatas kedalaman),
 * lalu mencari irisan — termasuk jika salah satunya adalah leluhur langsung.
 */
export async function checkInbreeding(
  indukId: string,
  pejantanId: string
): Promise<InbreedingCheckResult> {
  const [indukAncestors, pejantanAncestors] = await Promise.all([
    getAncestorIds(indukId),
    getAncestorIds(pejantanId),
  ])

  // Tambahkan ID masing-masing sebagai kandidat (cek jika salah satu adalah leluhur langsung)
  indukAncestors.add(indukId)
  pejantanAncestors.add(pejantanId)

  // Cari irisan
  const sharedIds = [...indukAncestors].filter((id) => pejantanAncestors.has(id))

  // Keluarkan ID induk dan pejantan itu sendiri dari hasil irisan
  const filteredIds = sharedIds.filter((id) => id !== indukId && id !== pejantanId)

  if (filteredIds.length === 0) {
    return { isRisk: false, sharedAncestors: [] }
  }

  // Ambil detail hewan yang menjadi leluhur bersama
  const sharedHewan = await prisma.hewan.findMany({
    where: { id: { in: filteredIds } },
    select: { id: true, tag: true, nama: true, kelamin: true },
  })

  return {
    isRisk: true,
    sharedAncestors: sharedHewan,
  }
}
