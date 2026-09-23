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
 * Mengambil pohon silsilah rekursif untuk sebuah hewan dalam SATU QUERY (Recursive CTE).
 * Mencegah N+1 query problem yang membuat loading profil sangat lambat.
 */
export async function buildSilsilahTree(
  hewanId: string,
  maxDepth = 10
): Promise<SilsilahNode | null> {
  const rows = await prisma.$queryRaw<
    {
      id: string
      tag: string
      nama: string | null
      kelamin: string
      tanggalLahir: Date
      bapakId: string | null
      indukId: string | null
      depth: number
    }[]
  >`
    WITH RECURSIVE ancestors AS (
      -- Base case: target hewan
      SELECT id, tag, nama, kelamin, "tanggalLahir", "bapakId", "indukId", 0 as depth
      FROM "Hewan"
      WHERE id = ${hewanId}

      UNION ALL

      -- Recursive step
      SELECT h.id, h.tag, h.nama, h.kelamin, h."tanggalLahir", h."bapakId", h."indukId", a.depth + 1
      FROM "Hewan" h
      INNER JOIN ancestors a ON h.id = a."bapakId" OR h.id = a."indukId"
      WHERE a.depth < ${maxDepth}
    )
    SELECT * FROM ancestors
  `

  if (!rows || rows.length === 0) return null

  // Karena JOIN bisa membuat duplikat ID di lineage berbeda (inbreeding),
  // kita map ID ke object untuk referensi unik.
  const nodeMap = new Map<string, SilsilahNode>()

  // Buat objek node untuk semua row yang didapat
  for (const row of rows) {
    if (!nodeMap.has(row.id)) {
      nodeMap.set(row.id, {
        id: row.id,
        tag: row.tag,
        nama: row.nama,
        kelamin: row.kelamin,
        tanggalLahir: row.tanggalLahir,
      })
    }
  }

  // Rekonstruksi tree di memory menggunakan nodeMap (berdasarkan baris orisinal untuk relasi)
  // Untuk menghindari cycle / stack overflow (karena inbreeding dsb), kita build tree
  // menggunakan fungsi rekursif sederhana di memory, mencari dari baris yang tersedia.
  function buildNode(currentId: string, currentDepth: number): SilsilahNode | undefined {
    if (currentDepth > maxDepth) return undefined
    const row = rows.find(r => r.id === currentId && r.depth === currentDepth)
    if (!row) return undefined

    const nodeInfo = nodeMap.get(currentId)!
    
    // Create a new instance per position in tree (since inbreeding means same animal appears twice in different branches)
    const treeNode: SilsilahNode = {
      ...nodeInfo
    }

    if (row.bapakId) {
      const bapak = buildNode(row.bapakId, currentDepth + 1)
      if (bapak) treeNode.bapak = bapak
    }
    
    if (row.indukId) {
      const induk = buildNode(row.indukId, currentDepth + 1)
      if (induk) treeNode.induk = induk
    }

    return treeNode
  }

  const root = buildNode(hewanId, 0)
  return root || null
}
