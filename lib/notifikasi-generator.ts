/**
 * Auto-generator untuk notifikasi farm.
 * Dipanggil saat GET /api/notifikasi (farm aktif), setelah mutasi terkait, dan cron harian.
 * Dedup dijamin database lewat @@unique([farmId, refKey]) — aman walau dipanggil bersamaan.
 */

import { prisma } from './prisma'
import { pushToFarm } from './push'
import type { TipeNotifikasi } from '@prisma/client'

const HARI = 24 * 60 * 60 * 1000
const MAKS_PER_JENIS = 20

type Kandidat = {
  title: string
  message: string
  tanggal: Date
  type: TipeNotifikasi
  farmId: string
  refKey: string
}

const tglID = (d: Date) => d.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })

/** Membuat notifikasi baru untuk satu farm lalu mengirim push. Mengembalikan jumlah notifikasi baru. */
export async function generateNotifikasiOtomatis(farmId: string): Promise<number> {
  const now = new Date()
  const [medis, lahir, berat] = await Promise.all([
    kontrolMedisDue(now, farmId),
    kelahiranMendekat(now, farmId),
    penimbanganTerlambat(now, farmId),
  ])

  const baru = await prisma.notifikasi.createManyAndReturn({
    data: [...medis, ...lahir, ...berat],
    skipDuplicates: true,
    select: { title: true, message: true, refKey: true },
  })

  if (baru.length > 0) await kirimPush(farmId, baru)
  return baru.length
}

/** Untuk cron: jalankan generator di semua farm aktif. */
export async function generateUntukSemuaFarm(): Promise<{ farm: number; notifikasiBaru: number }> {
  const farms = await prisma.farm.findMany({
    where: { status: 'AKTIF', deletedAt: null },
    select: { id: true },
  })

  let total = 0
  // ponytail: 5 farm sekaligus supaya pool koneksi Neon tidak habis; ganti ke query gabungan jika farm > ~500
  for (let i = 0; i < farms.length; i += 5) {
    const hasil = await Promise.all(farms.slice(i, i + 5).map((f) => generateNotifikasiOtomatis(f.id)))
    total += hasil.reduce((a, b) => a + b, 0)
  }
  return { farm: farms.length, notifikasiBaru: total }
}

async function kirimPush(farmId: string, baru: { title: string; message: string; refKey: string | null }[]) {
  const farm = await prisma.farm.findUnique({ where: { id: farmId }, select: { nama: true } })
  const namaFarm = farm?.nama ?? 'KostaHub'

  // Banyak notifikasi sekaligus → satu ringkasan supaya HP tidak dibanjiri
  if (baru.length > 3) {
    await pushToFarm(farmId, {
      title: `${namaFarm}: ${baru.length} notifikasi baru`,
      body: baru.slice(0, 3).map((n) => n.title).join('\n') + '\n…',
      url: '/notifikasi',
      tag: `ringkasan-${farmId}`,
    })
    return
  }
  await Promise.all(
    baru.map((n) =>
      pushToFarm(farmId, {
        title: `${namaFarm}: ${n.title}`,
        body: n.message,
        url: '/notifikasi',
        tag: n.refKey ?? undefined,
      })
    )
  )
}

// ─── KONTROL MEDIS DUE (≤ 3 hari lagi) ──────────────────────
async function kontrolMedisDue(now: Date, farmId: string): Promise<Kandidat[]> {
  const jadwal = await prisma.rekamMedis.findMany({
    where: {
      tanggalLanjut: { gte: now, lte: new Date(now.getTime() + 3 * HARI) },
      butuhNotifikasi: true,
      hewan: { farmId, kematian: { is: null } },
    },
    include: { hewan: { select: { tag: true, nama: true } } },
    orderBy: { tanggalLanjut: 'asc' },
    take: MAKS_PER_JENIS,
  })

  return jadwal.map((j) => ({
    title: `Jadwal Kontrol Medis: ${j.hewan.tag}${j.hewan.nama ? ` (${j.hewan.nama})` : ''}`,
    message: `${j.diagnosis} — kontrol ulang tanggal ${tglID(j.tanggalLanjut!)}.`,
    tanggal: j.tanggalLanjut!,
    type: 'MEDIS',
    farmId,
    refKey: `MEDIS-${j.id}`,
  }))
}

// ─── KELAHIRAN MENDEKAT (≤ 7 hari lagi) ─────────────────────
async function kelahiranMendekat(now: Date, farmId: string): Promise<Kandidat[]> {
  const kehamilan = await prisma.reproduksi.findMany({
    where: {
      status: 'HAMIL',
      estimasiLahir: { gte: now, lte: new Date(now.getTime() + 7 * HARI) },
      induk: { farmId, kematian: { is: null } },
    },
    include: { induk: { select: { tag: true, nama: true } } },
    orderBy: { estimasiLahir: 'asc' },
    take: MAKS_PER_JENIS,
  })

  return kehamilan.map((k) => ({
    title: `Estimasi Kelahiran: ${k.induk.tag}${k.induk.nama ? ` (${k.induk.nama})` : ''}`,
    message: `Induk ${k.induk.tag} diperkirakan melahirkan tanggal ${tglID(k.estimasiLahir)}. Siapkan kandang beranak.`,
    tanggal: k.estimasiLahir,
    type: 'LAHIR',
    farmId,
    refKey: `LAHIR-${k.id}`,
  }))
}

// ─── PENIMBANGAN TERLAMBAT (tidak ditimbang 30+ hari) ───────
async function penimbanganTerlambat(now: Date, farmId: string): Promise<Kandidat[]> {
  const batas = new Date(now.getTime() - 30 * HARI)
  const hewan = await prisma.hewan.findMany({
    where: {
      farmId,
      kematian: { is: null },
      createdAt: { lte: batas },
      beratHistory: { none: { tanggal: { gte: batas } } },
    },
    select: { id: true, tag: true, nama: true },
    orderBy: { createdAt: 'asc' },
    take: MAKS_PER_JENIS,
  })

  // Satu pengingat per hewan per bulan → bisa muncul lagi bulan depan jika masih belum ditimbang
  const bulan = now.toISOString().slice(0, 7)
  return hewan.map((h) => ({
    title: `Penimbangan Tertunda: ${h.tag}${h.nama ? ` (${h.nama})` : ''}`,
    message: `Hewan ${h.tag} belum ditimbang lebih dari 30 hari. Lakukan penimbangan segera.`,
    tanggal: now,
    type: 'BERAT',
    farmId,
    refKey: `BERAT-${h.id}-${bulan}`,
  }))
}
