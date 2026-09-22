import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/Dashboard/DashboardClient'

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let farmId = session.activeFarmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }
  const farmFilter = farmId ? { farmId } : {}
  const medisFarmFilter = farmId ? { hewan: { farmId } } : {}
  const reproduksiFarmFilter = farmId ? { induk: { farmId } } : {}
  const kematianFarmFilter = farmId ? { hewan: { farmId } } : {}

  // ─── BASE STATS (snapshot saat ini) ──────────────────────────
  const [
    totalHewan,
    indukan,
    pejantan,
    mati,
    reproduksiHamil,
    notifikasiMedis,
    kategoriStats,
    farmCount,
  ] = await Promise.all([
    prisma.hewan.count({ where: farmFilter }),
    prisma.hewan.count({ where: { kategori: 'INDUKAN', ...farmFilter } }),
    prisma.hewan.count({ where: { kategori: 'PEJANTAN', ...farmFilter } }),
    prisma.kematianHewan.count({ where: kematianFarmFilter }),
    prisma.reproduksi.findMany({
      where: {
        status: 'HAMIL',
        ...(farmId ? { induk: { is: { farmId } } } : {}),
      },
      orderBy: { estimasiLahir: 'asc' },
      take: 5,
      include: { induk: true },
    }),
    prisma.notifikasi.findMany({
      where: {
        isRead: false,
        type: 'MEDIS',
        ...(farmId ? { farmId } : {}),
      },
      orderBy: { tanggal: 'asc' },
      take: 5,
    }),
    prisma.hewan.groupBy({
      by: ['kategori'],
      _count: true,
      where: farmFilter,
    }),
    session.role === 'SUPER_ADMIN' ? prisma.farm.count() : Promise.resolve(1),
  ])

  // ─── OVERVIEW METRICS ─────────────────────────────────────
  const totalSemua = totalHewan
  const mortalityRate = totalSemua > 0 ? Math.round((mati / totalSemua) * 100) : 0
  const totalHidup = totalHewan - mati

  const [totalLahir, totalGagal] = await Promise.all([
    prisma.reproduksi.count({ where: { status: 'LAHIR', ...reproduksiFarmFilter } }),
    prisma.reproduksi.count({ where: { status: 'GAGAL', ...reproduksiFarmFilter } }),
  ])
  const totalReproduksiSelesai = totalLahir + totalGagal
  const birthSuccessRate = totalReproduksiSelesai > 0
    ? Math.round((totalLahir / totalReproduksiSelesai) * 100)
    : 0

  // ─── RAW TIME-SERIES DATA (2 tahun, untuk client-side filtering) ──────
  const twoYearsAgo = new Date()
  twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
  twoYearsAgo.setHours(0, 0, 0, 0)

  const [trendRaw, kematianTrendRaw, beratRaw, diagnosisRaw] = await Promise.all([
    // Hewan masuk (terdaftar) trend
    prisma.hewan.findMany({
      where: { createdAt: { gte: twoYearsAgo }, ...farmFilter },
      select: { createdAt: true },
    }),
    // Kematian trend
    prisma.kematianHewan.findMany({
      where: {
        tanggalMati: { gte: twoYearsAgo },
        ...kematianFarmFilter,
      },
      select: { tanggalMati: true },
    }),
    // Berat trend
    prisma.beratBadan.findMany({
      where: { tanggal: { gte: twoYearsAgo }, hewan: farmFilter },
      select: { tanggal: true, berat: true },
      orderBy: { tanggal: 'asc' },
      take: 1000,
    }),
    // Diagnosis
    prisma.rekamMedis.findMany({
      where: { ...medisFarmFilter, tanggal: { gte: twoYearsAgo } },
      select: { diagnosis: true, tanggal: true },
    }),
  ])

  // ─── DISTRIBUSI UMUR (snapshot semua hewan hidup) ─────────────
  // Hewan hidup = hewan yang tidak punya kematian record
  const hewanMatiIds = await prisma.kematianHewan.findMany({
    where: kematianFarmFilter,
    select: { hewanId: true },
  })
  const matiIdSet = new Set(hewanMatiIds.map(k => k.hewanId))

  const allHewan = await prisma.hewan.findMany({
    where: farmFilter,
    select: { id: true, tanggalLahir: true },
  })
  const allHewanHidup = allHewan.filter(h => !matiIdSet.has(h.id))

  const now = new Date()
  const ageGroups = { '0-6 bln': 0, '6-12 bln': 0, '1-2 thn': 0, '2-3 thn': 0, '3+ thn': 0 }
  allHewanHidup.forEach(h => {
    const months = (now.getTime() - h.tanggalLahir.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
    if (months < 6) ageGroups['0-6 bln']++
    else if (months < 12) ageGroups['6-12 bln']++
    else if (months < 24) ageGroups['1-2 thn']++
    else if (months < 36) ageGroups['2-3 thn']++
    else ageGroups['3+ thn']++
  })
  const distribusiUmur = Object.entries(ageGroups)
    .map(([name, value]) => ({ name, value }))
    .filter(d => d.value > 0)

  // ─── RATA-RATA BERAT (populasi hidup, snapshot) ─────────────
  const allWeights = await prisma.hewan.findMany({
    where: { berat: { not: null }, id: { notIn: [...matiIdSet] }, ...farmFilter },
    select: { berat: true },
  })
  const avgBerat = allWeights.length > 0
    ? Math.round((allWeights.reduce((a, h) => a + (h.berat || 0), 0) / allWeights.length) * 10) / 10
    : 0

  // ─── KATEGORI DATA (snapshot populasi hidup) ─────────────
  const [totalIndukan, totalPejantan, totalAnakan, totalDara, totalJantanMuda] = await Promise.all([
    prisma.hewan.count({ where: { kategori: 'INDUKAN', id: { notIn: [...matiIdSet] }, ...farmFilter } }),
    prisma.hewan.count({ where: { kategori: 'PEJANTAN', id: { notIn: [...matiIdSet] }, ...farmFilter } }),
    prisma.hewan.count({ where: { kategori: 'ANAKAN', id: { notIn: [...matiIdSet] }, ...farmFilter } }),
    prisma.hewan.count({ where: { kategori: 'DARA', id: { notIn: [...matiIdSet] }, ...farmFilter } }),
    prisma.hewan.count({ where: { kategori: 'JANTAN_MUDA', id: { notIn: [...matiIdSet] }, ...farmFilter } }),
  ])
  const kategoriData = [
    { name: 'Indukan', value: totalIndukan },
    { name: 'Pejantan', value: totalPejantan },
    { name: 'Anakan', value: totalAnakan },
    { name: 'Dara', value: totalDara },
    { name: 'Jantan Muda', value: totalJantanMuda },
  ].filter(k => k.value > 0)

  return (
    <DashboardClient
      stats={{ totalHewan: totalHidup, indukan, pejantan, sedangSakit: totalHidup, mati, terjual: 0 }}
      reproduksiHamil={reproduksiHamil.map(r => ({
        ...r,
        tanggalKawin: r.tanggalKawin.toISOString(),
        estimasiLahir: r.estimasiLahir.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        induk: {
          ...r.induk,
          tanggalLahir: r.induk.tanggalLahir.toISOString(),
          createdAt: r.induk.createdAt.toISOString(),
          updatedAt: r.induk.updatedAt.toISOString(),
        },
      }))}
      notifikasiMedis={notifikasiMedis.map(n => ({
        ...n,
        tanggal: n.tanggal.toISOString(),
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }))}
      kategoriStats={kategoriStats}
      isSuperAdmin={session.role === 'SUPER_ADMIN'}
      farmCount={farmCount as number}
      overviewData={{
        mortalityRate,
        birthSuccessRate,
        totalLahir,
        totalGagal,
        totalHamil: reproduksiHamil.length,
        avgBerat,
        kategoriData,
        distribusiUmur,
      }}
      trendRaw={trendRaw.map(h => ({
        createdAt: h.createdAt.toISOString(),
        status: 'AKTIF', // legacy compat - semua hewan terdaftar dianggap masuk
      }))}
      kematianTrendRaw={kematianTrendRaw.map(k => ({
        tanggalMati: k.tanggalMati.toISOString(),
      }))}
      beratRaw={beratRaw.map(b => ({
        tanggal: b.tanggal.toISOString(),
        berat: b.berat,
      }))}
      diagnosisRaw={diagnosisRaw.map(d => ({
        diagnosis: d.diagnosis,
        tanggal: d.tanggal.toISOString(),
      }))}
    />
  )
}
