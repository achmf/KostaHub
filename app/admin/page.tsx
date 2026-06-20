import { prisma } from '@/lib/prisma'
import AdminDashboardClient from '@/components/Admin/AdminDashboardClient'

export default async function AdminPage() {
  // ─── DATE RANGES ─────────────────────────────────────────────
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  // ─── AGGREGATE STATS ────────────────────────────────────────
  const [
    totalFarm,
    farmAktif,
    totalUser,
    totalHewan,
    totalMati,
    totalTerjual,
    pendingApprovals,
    totalOwner,
  ] = await Promise.all([
    prisma.farm.count(),
    prisma.farm.count({ where: { status: 'AKTIF' } }),
    prisma.user.count({ where: { deletedAt: null, approvalStatus: 'APPROVED' } }),
    prisma.hewan.count({ where: { status: 'AKTIF' } }),
    prisma.hewan.count({ where: { status: 'MATI' } }),
    prisma.hewan.count({ where: { status: 'TERJUAL' } }),
    prisma.farm.count({ where: { status: 'NONAKTIF', deletedAt: null, rejectionReason: null } }),
    prisma.user.count({ where: { role: 'OWNER', deletedAt: null } }),
  ])

  // ─── TREND vs LAST MONTH ─────────────────────────────────────
  const [
    farmBulanIni,
    farmBulanLalu,
    userBulanIni,
    userBulanLalu,
    hewanMasukBulanIni,
    hewanMasukBulanLalu,
    hewanMatiBulanIni,
    hewanMatiBulanLalu,
  ] = await Promise.all([
    prisma.farm.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.farm.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.user.count({ where: { createdAt: { gte: thisMonthStart }, deletedAt: null } }),
    prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, deletedAt: null } }),
    prisma.hewan.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.hewan.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
    prisma.hewan.count({ where: { status: 'MATI', updatedAt: { gte: thisMonthStart } } }),
    prisma.hewan.count({ where: { status: 'MATI', updatedAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
  ])

  function calcDelta(curr: number, prev: number) {
    if (prev === 0) return curr > 0 ? 100 : 0
    return Math.round(((curr - prev) / prev) * 100)
  }

  const trend = {
    farm: { curr: farmBulanIni, delta: calcDelta(farmBulanIni, farmBulanLalu) },
    user: { curr: userBulanIni, delta: calcDelta(userBulanIni, userBulanLalu) },
    hewanMasuk: { curr: hewanMasukBulanIni, delta: calcDelta(hewanMasukBulanIni, hewanMasukBulanLalu) },
    hewanMati: { curr: hewanMatiBulanIni, delta: calcDelta(hewanMatiBulanIni, hewanMatiBulanLalu) },
  }

  // ─── MORTALITY RATE ──────────────────────────────────────────
  const totalSemua = totalHewan + totalMati + totalTerjual
  const mortalityRate = totalSemua > 0 ? Math.round((totalMati / totalSemua) * 100) : 0

  // ─── REPRODUKSI ──────────────────────────────────────────────
  const [totalLahir, totalGagal, totalHamil] = await Promise.all([
    prisma.reproduksi.count({ where: { status: 'LAHIR' } }),
    prisma.reproduksi.count({ where: { status: 'GAGAL' } }),
    prisma.reproduksi.count({ where: { status: 'HAMIL' } }),
  ])
  const totalReproduksiSelesai = totalLahir + totalGagal
  const birthSuccessRate = totalReproduksiSelesai > 0
    ? Math.round((totalLahir / totalReproduksiSelesai) * 100)
    : 0

  // ─── TREND POPULASI 6 BULAN (semua farm) ─────────────────────
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const hewanBaru = await prisma.hewan.findMany({
    where: { createdAt: { gte: sixMonthsAgo } },
    select: { createdAt: true, status: true },
  })

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
  const trendMap = new Map<string, { masuk: number; mati: number; terjual: number }>()
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    trendMap.set(key, { masuk: 0, mati: 0, terjual: 0 })
  }
  hewanBaru.forEach((h) => {
    const key = `${h.createdAt.getFullYear()}-${String(h.createdAt.getMonth() + 1).padStart(2, '0')}`
    const entry = trendMap.get(key)
    if (entry) {
      entry.masuk++
      if (h.status === 'MATI') entry.mati++
      if (h.status === 'TERJUAL') entry.terjual++
    }
  })
  const trendData = Array.from(trendMap.entries()).map(([key, val]) => {
    const m = key.split('-')[1]
    return { label: monthNames[parseInt(m) - 1], ...val }
  })

  // ─── PERBANDINGAN ANTAR FARM ──────────────────────────────────
  const farms = await prisma.farm.findMany({
    select: {
      id: true,
      nama: true,
      status: true,
      updatedAt: true,
      _count: { select: { hewan: true, members: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Health score per farm (aktif / total * 100)
  const farmsWithHealth = await Promise.all(
    farms.map(async (f) => {
      const [aktif, mati, terjual] = await Promise.all([
        prisma.hewan.count({ where: { farmId: f.id, status: 'AKTIF' } }),
        prisma.hewan.count({ where: { farmId: f.id, status: 'MATI' } }),
        prisma.hewan.count({ where: { farmId: f.id, status: 'TERJUAL' } }),
      ])
      const total = aktif + mati + terjual
      const healthScore = total > 0 ? Math.round((aktif / total) * 100) : 100
      const mortalityRateFarm = total > 0 ? Math.round((mati / total) * 100) : 0
      return { ...f, aktif, mati, total, healthScore, mortalityRateFarm }
    })
  )

  const farmComparison = farmsWithHealth.map((f) => ({
    id: f.id,
    nama: f.nama.length > 18 ? f.nama.slice(0, 18) + '…' : f.nama,
    namaPanjang: f.nama,
    hewan: f._count.hewan,
    user: f._count.members,
    status: f.status,
    healthScore: f.healthScore,
    mortalityRateFarm: f.mortalityRateFarm,
  }))

  // ─── INACTIVE FARM DETECTION (no activity > 30 days) ─────────
  const latestActivity = await prisma.hewan.findMany({
    where: { status: 'AKTIF', farm: { status: 'AKTIF' } },
    select: { farmId: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
  })

  const latestPerFarm = new Map<string, Date>()
  latestActivity.forEach((h) => {
    const existing = latestPerFarm.get(h.farmId)
    if (!existing || h.updatedAt > existing) {
      latestPerFarm.set(h.farmId, h.updatedAt)
    }
  })

  const inactiveFarms = farmsWithHealth
    .filter((f) => f.status === 'AKTIF')
    .filter((f) => {
      const lastAct = latestPerFarm.get(f.id)
      return !lastAct || lastAct < thirtyDaysAgo
    })
    .map((f) => ({
      id: f.id,
      nama: f.nama,
      reason: latestPerFarm.get(f.id)
        ? `Tidak ada aktivitas ${Math.floor((now.getTime() - latestPerFarm.get(f.id)!.getTime()) / (1000 * 60 * 60 * 24))} hari`
        : 'Belum ada data hewan',
    }))

  // ─── HIGH MORTALITY ALERTS ────────────────────────────────────
  const highMortalityFarms = farmsWithHealth
    .filter((f) => f.mortalityRateFarm > 20 && f.total > 0 && f.status === 'AKTIF')
    .map((f) => ({ id: f.id, nama: f.nama, mortalityRate: f.mortalityRateFarm }))
    .slice(0, 5)

  // ─── DISTRIBUSI KATEGORI REGIONAL ────────────────────────────
  const kategoriStats = await prisma.hewan.groupBy({
    by: ['kategori'],
    _count: true,
    where: { status: 'AKTIF' },
  })
  const kategoriData = kategoriStats.map((k) => ({
    name: k.kategori === 'INDUKAN' ? 'Indukan'
      : k.kategori === 'PEJANTAN' ? 'Pejantan'
      : k.kategori === 'ANAKAN' ? 'Anakan'
      : k.kategori === 'DARA' ? 'Dara'
      : 'Jantan Muda',
    value: k._count,
  })).filter((k) => k.value > 0)

  // ─── TOP DIAGNOSA REGIONAL ────────────────────────────────────
  const allMedis = await prisma.rekamMedis.findMany({
    select: { diagnosis: true },
    take: 500,
  })
  const diagnosisCount = new Map<string, number>()
  allMedis.forEach((m) => {
    const d = m.diagnosis.trim()
    if (d) diagnosisCount.set(d, (diagnosisCount.get(d) || 0) + 1)
  })
  const topDiagnosa = Array.from(diagnosisCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  // ─── FARM ALERTS (farm tanpa hewan aktif atau nonaktif) ───────
  const farmAlerts: { id: string; nama: string; reason: string }[] = []
  farms.forEach((f) => {
    if (f.status === 'NONAKTIF') {
      farmAlerts.push({ id: f.id, nama: f.nama, reason: 'Farm Nonaktif' })
    } else if (f._count.hewan === 0) {
      farmAlerts.push({ id: f.id, nama: f.nama, reason: 'Tidak ada hewan' })
    }
  })

  // ─── RECENT APPROVALS ─────────────────────────────────────────
  const recentPending = await prisma.farm.findMany({
    where: { status: 'NONAKTIF', deletedAt: null, rejectionReason: null },
    include: {
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
        where: { user: { role: 'OWNER', deletedAt: null } },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  return (
    <AdminDashboardClient
      stats={{
        totalFarm,
        farmAktif,
        totalUser,
        totalHewan,
        mortalityRate,
        pendingApprovals,
        totalOwner,
        birthSuccessRate,
        totalHamil,
      }}
      trend={trend}
      trendData={trendData}
      farmComparison={farmComparison}
      kategoriData={kategoriData}
      topDiagnosa={topDiagnosa}
      farmAlerts={farmAlerts}
      inactiveFarms={inactiveFarms}
      highMortalityFarms={highMortalityFarms}
      recentPending={recentPending.map((farm) => ({
        id: farm.id,
        name: farm.members[0]?.user?.name ?? '(Owner)',
        email: farm.members[0]?.user?.email ?? '',
        createdAt: farm.createdAt.toISOString(),
      }))}
    />
  )
}
