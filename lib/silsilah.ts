import { prisma } from '@/lib/prisma'

export type SilsilahNode = {
  id: string
  tag: string
  nama: string | null
  kelamin: string
  tanggalLahir: Date
  bapak?: SilsilahNode
  induk?: SilsilahNode
}

type AncestorRow = { id: string }

/**
 * Mengambil semua ID leluhur dari seekor hewan menggunakan PostgreSQL Recursive CTE.
 * Tidak ada batas kedalaman — semua leluhur yang tercatat di DB akan dikembalikan.
 */
export async function getAncestorIds(hewanId: string): Promise<Set<string>> {
  const rows = await prisma.$queryRaw<AncestorRow[]>`
    WITH RECURSIVE ancestors AS (
      -- Base case: diri sendiri
      SELECT id, "bapakId", "indukId"
      FROM "Hewan"
      WHERE id = ${hewanId}

      UNION ALL

      -- Recursive: ambil bapak dan induk dari setiap node
      SELECT h.id, h."bapakId", h."indukId"
      FROM "Hewan" h
      INNER JOIN ancestors a ON h.id = a."bapakId" OR h.id = a."indukId"
    )
    SELECT id FROM ancestors WHERE id != ${hewanId}
  `

  return new Set(rows.map((r) => r.id))
}

/**
 * Mengambil pohon silsilah rekursif untuk sebuah hewan.
 * Depth dibatasi agar tidak infinite loop jika ada data korup.
 */
export async function buildSilsilahTree(
  hewanId: string,
  maxDepth = 10,
  currentDepth = 0
): Promise<SilsilahNode | null> {
  if (currentDepth >= maxDepth) return null

  const hewan = await prisma.hewan.findUnique({
    where: { id: hewanId },
    select: { id: true, tag: true, nama: true, kelamin: true, tanggalLahir: true, bapakId: true, indukId: true },
  })

  if (!hewan) return null

  const node: SilsilahNode = {
    id: hewan.id,
    tag: hewan.tag,
    nama: hewan.nama,
    kelamin: hewan.kelamin,
    tanggalLahir: hewan.tanggalLahir,
  }

  if (hewan.bapakId) {
    const bapakTree = await buildSilsilahTree(hewan.bapakId, maxDepth, currentDepth + 1)
    if (bapakTree) node.bapak = bapakTree
  }

  if (hewan.indukId) {
    const indukTree = await buildSilsilahTree(hewan.indukId, maxDepth, currentDepth + 1)
    if (indukTree) node.induk = indukTree
  }

  return node
}
