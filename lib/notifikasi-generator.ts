/**
 * Auto-generator untuk notifikasi farm.
 * Dipanggil setiap GET /api/notifikasi untuk memastikan
 * event penting selalu tercermin di daftar notifikasi.
 */

import { prisma } from './prisma'

export async function generateNotifikasiOtomatis(farmId: string | null) {
  const now = new Date()

  const hewanFilter = farmId ? { farmId } : {}
  const reproduksiFilter = farmId ? { induk: { farmId } } : {}
  const medisFilter = farmId ? { hewan: { farmId } } : {}

  await Promise.all([
    generateVaksinDue(now, medisFilter, farmId),
    generateKelahiranMendekat(now, reproduksiFilter, farmId),
    generatePenimbanganTerlambat(now, hewanFilter, farmId),
  ])
}

// ─── VAKSIN / KONTROL DUE ─────────────────────────────────
async function generateVaksinDue(
  now: Date,
  filter: object,
  farmId: string | null
) {
  const tiga_hari = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

  const jadwal = await prisma.rekamMedis.findMany({
    where: {
      tanggalLanjut: { gte: now, lte: tiga_hari },
      ...filter,
    },
    include: { hewan: { select: { tag: true, nama: true } } },
    take: 20,
  })

  for (const j of jadwal) {
    const tag = j.hewan?.tag ?? 'unknown'
    const nama = j.hewan?.nama ? ` (${j.hewan.nama})` : ''
    const tgl = j.tanggalLanjut!.toLocaleDateString('id-ID')
    const key = `VAKSIN-${j.id}`

    const existing = await prisma.notifikasi.findFirst({
      where: { message: { contains: key } },
    })
    if (existing) continue

    await prisma.notifikasi.create({
      data: {
        title: `Jadwal Kontrol Medis: ${tag}${nama}`,
        message: `${j.diagnosis} — kontrol ulang tanggal ${tgl}. [ref:${key}]`,
        tanggal: j.tanggalLanjut!,
        type: 'VAKSIN',
        farmId,
      },
    })
  }
}

// ─── KELAHIRAN MENDEKAT ────────────────────────────────────
async function generateKelahiranMendekat(
  now: Date,
  filter: object,
  farmId: string | null
) {
  const tujuh_hari = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const kehamilan = await prisma.reproduksi.findMany({
    where: {
      status: 'HAMIL',
      estimasiLahir: { gte: now, lte: tujuh_hari },
      ...filter,
    },
    include: {
      induk: { select: { tag: true, nama: true } },
    },
    take: 20,
  })

  for (const k of kehamilan) {
    const tag = k.induk?.tag ?? 'unknown'
    const nama = k.induk?.nama ? ` (${k.induk.nama})` : ''
    const tgl = k.estimasiLahir.toLocaleDateString('id-ID')
    const key = `LAHIR-${k.id}`

    const existing = await prisma.notifikasi.findFirst({
      where: { message: { contains: key } },
    })
    if (existing) continue

    await prisma.notifikasi.create({
      data: {
        title: `Estimasi Kelahiran: ${tag}${nama}`,
        message: `Induk ${tag} diperkirakan melahirkan tanggal ${tgl}. Siapkan kandang beranak. [ref:${key}]`,
        tanggal: k.estimasiLahir,
        type: 'LAHIR',
        farmId,
      },
    })
  }
}

// ─── PENIMBANGAN TERLAMBAT ─────────────────────────────────
async function generatePenimbanganTerlambat(
  now: Date,
  filter: object,
  farmId: string | null
) {
  const tiga_puluh_hari_lalu = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // Cari hewan aktif yang beratnya belum diupdate 30+ hari
  const hewan = await prisma.hewan.findMany({
    where: {
      status: 'AKTIF',
      updatedAt: { lte: tiga_puluh_hari_lalu },
      ...filter,
    },
    select: { id: true, tag: true, nama: true, updatedAt: true },
    take: 10,
  })

  for (const h of hewan) {
    const key = `BERAT-${h.id}-${tiga_puluh_hari_lalu.toISOString().split('T')[0]}`

    const existing = await prisma.notifikasi.findFirst({
      where: { message: { contains: `BERAT-${h.id}` } },
    })
    if (existing) continue

    const nama = h.nama ? ` (${h.nama})` : ''
    await prisma.notifikasi.create({
      data: {
        title: `Penimbangan Tertunda: ${h.tag}${nama}`,
        message: `Hewan ${h.tag} belum ditimbang lebih dari 30 hari. Lakukan penimbangan segera. [ref:${key}]`,
        tanggal: now,
        type: 'BERAT',
        farmId,
      },
    })
  }
}
