import { prisma } from '@/lib/prisma'
import { getAncestorDepths } from '@/lib/silsilah'
import { BATAS_GENERASI, leluhurBersama } from '@/lib/inbreeding-rules'

export { BATAS_GENERASI, leluhurBersama }

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
 * Mengambil leluhur kedua hewan sampai BATAS_GENERASI (4) generasi,
 * lalu mencari irisan, termasuk jika salah satunya adalah leluhur langsung.
 */
export async function checkInbreeding(
  indukId: string,
  pejantanId: string
): Promise<InbreedingCheckResult> {
  const [indukAncestors, pejantanAncestors] = await Promise.all([
    getAncestorDepths(indukId, BATAS_GENERASI),
    getAncestorDepths(pejantanId, BATAS_GENERASI),
  ])

  const filteredIds = leluhurBersama(indukAncestors, pejantanAncestors, indukId, pejantanId)

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
