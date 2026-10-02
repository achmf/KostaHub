'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { withAuth, withMutationAuth } from '@/lib/auth'
import { invalidateHewan } from '@/lib/cache-invalidation'

// Web NFC memberi "04:8f:21:4a", reader USB biasanya "048F214A" → bandingkan tanpa pemisah & huruf besar.
// Harus sama dengan ekspresi SQL di bawah.
const normalisasiUid = (uid: string) => uid.replace(/[^0-9a-z]/gi, '').toUpperCase()

type CariHasil = { id: string } | { error: string }

/** Cari hewan dari UID tag RFID/NFC (hanya tag AKTIF, dibatasi farm aktif kecuali Super Admin tanpa farm). */
export const cariHewanByRfid = withAuth(async (session, uid: string): Promise<CariHasil> => {
  const kunci = normalisasiUid(uid)
  if (!kunci) return { error: 'UID tag tidak valid' }

  const farmId = session.activeFarmId
  if (!farmId && session.role !== 'SUPER_ADMIN') return { error: 'Pilih farm terlebih dahulu' }

  const [hit] = await prisma.$queryRaw<{ id: string }[]>`
    SELECT h.id FROM "TagRfid" t
    JOIN "Hewan" h ON h.id = t."hewanId"
    WHERE t.status = 'AKTIF'
      AND upper(regexp_replace(t."rfidUid", '[^0-9A-Za-z]', '', 'g')) = ${kunci}
      AND (${farmId}::text IS NULL OR h."farmId" = ${farmId})
    LIMIT 1`

  return hit ? { id: hit.id } : { error: 'Tag ini belum terdaftar pada hewan di farm ini' }
})

/** Daftarkan tag ke hewan. Satu hewan hanya punya satu tag AKTIF; tag lama otomatis dicopot. */
export const saveRfidTag = withMutationAuth(async (session, hewanId: string, uid: string): Promise<{ success: true } | { error: string }> => {
  const uidBersih = uid.trim()
  const kunci = normalisasiUid(uidBersih)
  if (!kunci || uidBersih.length > 64) return { error: 'UID tag tidak valid' }

  const hewan = await prisma.hewan.findUnique({ where: { id: hewanId }, select: { farmId: true } })
  if (!hewan) return { error: 'Hewan tidak ditemukan' }
  if (session.role !== 'SUPER_ADMIN' && hewan.farmId !== session.activeFarmId) return { error: 'Akses ditolak' }

  const [terdaftar] = await prisma.$queryRaw<{ hewanId: string; rfidUid: string }[]>`
    SELECT "hewanId", "rfidUid" FROM "TagRfid"
    WHERE upper(regexp_replace("rfidUid", '[^0-9A-Za-z]', '', 'g')) = ${kunci}
    LIMIT 1`
  if (terdaftar && terdaftar.hewanId !== hewanId) {
    return { error: 'Tag RFID ini sudah terdaftar pada hewan lain.' }
  }
  // Tag yang sama pernah dipasang di hewan ini (format UID beda) → aktifkan baris lamanya
  const rfidUid = terdaftar?.rfidUid ?? uidBersih

  await prisma.$transaction([
    prisma.tagRfid.updateMany({
      where: { hewanId, status: 'AKTIF', NOT: { rfidUid } },
      data: { status: 'DICOPOT', tanggalCopot: new Date() },
    }),
    prisma.tagRfid.upsert({
      where: { rfidUid },
      create: { hewanId, rfidUid, status: 'AKTIF' },
      update: { status: 'AKTIF', tanggalCopot: null },
    }),
  ])

  invalidateHewan()
  revalidatePath(`/hewan/${hewanId}`)
  return { success: true }
})
