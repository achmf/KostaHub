import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LaporanClient from './LaporanClient'

export default async function LaporanPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const searchParams = await props.searchParams

  let farmId = session.activeFarmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }

  const hewanFarmFilter = farmId ? { farmId } : {}
  const medisFarmFilter = farmId ? { hewan: { farmId } } : {}
  const reproduksiFarmFilter = farmId ? { induk: { farmId } } : {}
  const beratFarmFilter = farmId ? { hewan: { farmId } } : {}

  const isGlobal = !farmId
  let farmName = ''
  if (farmId) {
    const f = await prisma.farm.findUnique({ where: { id: farmId }, select: { nama: true } })
    if (f) farmName = f.nama
  }

  // ─── ACTION ITEMS ──────────────────────────────────────────
  const [hewanPerluPerhatian, kehamilanAktif, jadwalMedis, inbreedingAlerts] = await Promise.all([
    prisma.rekamMedis.findMany({
      where: { status: { in: ['RAWAT', 'PANTAU'] }, ...medisFarmFilter },
      include: { hewan: { select: { tag: true, nama: true, farm: { select: { nama: true } } } } },
      orderBy: { tanggal: 'desc' },
      take: 10,
    }),
    prisma.reproduksi.findMany({
      where: { status: 'HAMIL', ...reproduksiFarmFilter },
      include: {
        induk: { select: { tag: true, nama: true, farm: { select: { nama: true } } } },
        pejantan: { select: { tag: true } },
      },
      orderBy: { estimasiLahir: 'asc' },
      take: 10,
    }),
    prisma.rekamMedis.findMany({
      where: { tanggalLanjut: { gte: new Date() }, ...medisFarmFilter },
      include: { hewan: { select: { tag: true, nama: true } } },
      orderBy: { tanggalLanjut: 'asc' },
      take: 10,
    }),
    prisma.reproduksi.findMany({
      where: { inbreedingWarning: true, ...reproduksiFarmFilter },
      include: { induk: { select: { tag: true } }, pejantan: { select: { tag: true } } },
      orderBy: { tanggalKawin: 'desc' },
      take: 5,
    }),
  ])

  // ─── LAPORAN 1: KELUAR-MASUK TERNAK ───────────────────────
  const [hewanMasuk, hewanKeluar, mutasiData] = await Promise.all([
    // Masuk: hewan terdaftar (semua status, sorted by createdAt)
    prisma.hewan.findMany({
      where: { ...hewanFarmFilter },
      include: { farm: { select: { nama: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    // Keluar: hewan MATI atau TERJUAL
    prisma.hewan.findMany({
      where: { status: { in: ['MATI', 'TERJUAL'] }, ...hewanFarmFilter },
      include: { farm: { select: { nama: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    }),
    // Mutasi antar farm
    prisma.transferHewan.findMany({
      where: farmId ? { OR: [{ fromFarmId: farmId }, { toFarmId: farmId }] } : {},
      include: {
        hewan: { select: { tag: true, nama: true, kategori: true } },
        fromFarm: { select: { nama: true } },
        toFarm: { select: { nama: true } },
      },
      orderBy: { tanggal: 'desc' },
      take: 100,
    }),
  ])

  // ─── LAPORAN 2: KESEHATAN & MEDIS ──────────────────────────
  const medisData = await prisma.rekamMedis.findMany({
    where: medisFarmFilter,
    include: {
      hewan: {
        select: {
          tag: true,
          nama: true,
          kategori: true,
          farm: { select: { nama: true } },
        },
      },
    },
    orderBy: { tanggal: 'desc' },
    take: 200,
  })

  // ─── LAPORAN 3: BREEDING ────────────────────────────────────
  const breedingData = await prisma.reproduksi.findMany({
    where: reproduksiFarmFilter,
    include: {
      induk: {
        select: {
          tag: true, nama: true, berat: true,
          farm: { select: { nama: true } },
        },
      },
      pejantan: {
        select: { tag: true, nama: true, berat: true },
      },
      anak: {
        select: { tag: true, nama: true, kelamin: true, berat: true },
      },
    },
    orderBy: { tanggalKawin: 'desc' },
    take: 100,
  })

  // ─── LAPORAN 4: PERTUMBUHAN BOBOT ──────────────────────────
  const beratData = await prisma.beratBadan.findMany({
    where: beratFarmFilter,
    include: {
      hewan: {
        select: {
          tag: true, nama: true, kategori: true, kelamin: true,
          tanggalLahir: true,
          farm: { select: { nama: true } },
        },
      },
    },
    orderBy: [{ hewanId: 'asc' }, { tanggal: 'asc' }],
    take: 500,
  })

  // Group berat per hewan
  const beratPerHewan = new Map<string, {
    hewan: { tag: string; nama: string | null; kategori: string; kelamin: string; tanggalLahir: Date; farm: { nama: string } | null }
    records: { tanggal: Date; berat: number; catatan: string | null }[]
  }>()
  beratData.forEach(b => {
    if (!beratPerHewan.has(b.hewanId)) {
      beratPerHewan.set(b.hewanId, { hewan: b.hewan as any, records: [] })
    }
    beratPerHewan.get(b.hewanId)!.records.push({
      tanggal: b.tanggal,
      berat: b.berat,
      catatan: b.catatan,
    })
  })

  const pertumbuhanData = Array.from(beratPerHewan.values()).map(entry => {
    const records = entry.records
    const beratAwal = records[0]?.berat ?? 0
    const beratAkhir = records[records.length - 1]?.berat ?? 0
    const selisih = beratAkhir - beratAwal
    const daysDiff = records.length > 1
      ? (records[records.length - 1].tanggal.getTime() - records[0].tanggal.getTime()) / (1000 * 60 * 60 * 24)
      : 0
    const adg = daysDiff > 0 ? Math.round((selisih / daysDiff) * 1000) / 1000 : 0 // kg/hari

    return {
      hewan: entry.hewan,
      records: records.map(r => ({
        tanggal: r.tanggal.toISOString(),
        berat: r.berat,
        catatan: r.catatan,
      })),
      beratAwal,
      beratAkhir,
      selisih: Math.round(selisih * 10) / 10,
      adg,
      totalPengukuran: records.length,
    }
  })

  const data = {
    // Action Items
    hewanPerluPerhatian: hewanPerluPerhatian.map(r => ({
      id: r.id, tag: r.hewan?.tag, nama: r.hewan?.nama,
      farm: r.hewan?.farm?.nama, diagnosis: r.diagnosis,
      status: r.status, tanggal: r.tanggal.toISOString(),
    })),
    kehamilanAktif: kehamilanAktif.map(r => ({
      id: r.id, indukTag: r.induk?.tag, indukNama: r.induk?.nama,
      pejantanTag: r.pejantan?.tag, estimasiLahir: r.estimasiLahir.toISOString(),
      tanggalKawin: r.tanggalKawin.toISOString(), farm: r.induk?.farm?.nama,
    })),
    jadwalMedis: jadwalMedis.map(r => ({
      id: r.id, tag: r.hewan?.tag, nama: r.hewan?.nama,
      diagnosis: r.diagnosis, tanggalLanjut: r.tanggalLanjut!.toISOString(),
    })),
    inbreedingAlerts: inbreedingAlerts.map(r => ({
      id: r.id, indukTag: r.induk?.tag, pejantanTag: r.pejantan?.tag,
      tanggalKawin: r.tanggalKawin.toISOString(),
    })),

    // Laporan 1: Keluar-Masuk
    hewanMasuk: hewanMasuk.map(h => ({
      id: h.id, tag: h.tag, nama: h.nama, kelamin: h.kelamin,
      kategori: h.kategori, status: h.status, berat: h.berat,
      tanggalLahir: h.tanggalLahir.toISOString(),
      createdAt: h.createdAt.toISOString(),
      updatedAt: h.updatedAt.toISOString(),
      farm: h.farm?.nama,
    })),
    mutasiData: mutasiData.map(t => ({
      id: t.id, tag: t.hewan?.tag, nama: t.hewan?.nama, kategori: t.hewan?.kategori,
      fromFarm: t.fromFarm?.nama, toFarm: t.toFarm?.nama,
      tanggal: t.tanggal.toISOString(), alasan: t.alasan,
    })),

    // Laporan 2: Kesehatan & Medis
    medisData: medisData.map(m => ({
      id: m.id, hewanTag: m.hewan?.tag, hewanNama: m.hewan?.nama,
      hewanKategori: m.hewan?.kategori, farm: m.hewan?.farm?.nama,
      tanggal: m.tanggal.toISOString(), kategori: m.kategori,
      diagnosis: m.diagnosis, obat: m.obat, namaDokter: m.namaDokter,
      notes: m.notes, status: m.status,
      tanggalLanjut: m.tanggalLanjut?.toISOString() ?? null,
    })),

    // Laporan 3: Breeding
    breedingData: breedingData.map(r => ({
      id: r.id,
      indukTag: r.induk?.tag, indukNama: r.induk?.nama, indukBerat: r.induk?.berat,
      pejantanTag: r.pejantan?.tag, pejantanNama: r.pejantan?.nama, pejantanBerat: r.pejantan?.berat,
      tanggalKawin: r.tanggalKawin.toISOString(),
      estimasiLahir: r.estimasiLahir.toISOString(),
      status: r.status, inbreedingWarning: r.inbreedingWarning,
      anakTag: r.anakTag,
      anak: r.anak ? {
        tag: r.anak.tag, nama: r.anak.nama,
        kelamin: r.anak.kelamin, berat: r.anak.berat,
      } : null,
      farm: r.induk?.farm?.nama,
    })),

    // Laporan 4: Pertumbuhan
    pertumbuhanData,
  }

  return <LaporanClient data={data} isGlobal={isGlobal} farmName={farmName} farmId={farmId} />
}
