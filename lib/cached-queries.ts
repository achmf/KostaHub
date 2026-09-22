import { unstable_cache } from 'next/cache'
import { prisma } from './prisma'

// ─── Revalidation windows ────────────────────────────────────
const REVALIDATE_SHORT = 30   // 30 detik — dashboard data
const REVALIDATE_LONG  = 300  // 5 menit — laporan, analytics

// ─── Cache Tags ──────────────────────────────────────────────
// Digunakan oleh revalidateTag() di server actions
export const CACHE_TAGS = {
  dashboard: 'dashboard',
  admin: 'admin',
  hewan: 'hewan',
  medis: 'medis',
  reproduksi: 'reproduksi',
  laporan: 'laporan',
  berat: 'berat',
  farm: 'farm',
  staff: 'staff',
  notifikasi: 'notifikasi',
} as const

// ─── DASHBOARD STATS ─────────────────────────────────────────
export const getCachedDashboardData = unstable_cache(
  async (farmId: string | null) => {
    const farmFilter = farmId ? { farmId } : {}
    const kematianFarmFilter = farmId ? { hewan: { farmId } } : {}
    const reproduksiFarmFilter = farmId ? { induk: { farmId } } : {}

    // ── SINGLE BATCH: all stats in one Promise.all ──
    const [
      totalHewan,
      indukan,
      pejantan,
      mati,
      reproduksiHamil,
      notifikasiMedis,
      kategoriStats,
      totalLahir,
      totalGagal,
      hewanMatiIds,
      allHewan,
      allWeights,
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
      prisma.reproduksi.count({ where: { status: 'LAHIR', ...reproduksiFarmFilter } }),
      prisma.reproduksi.count({ where: { status: 'GAGAL', ...reproduksiFarmFilter } }),
      prisma.kematianHewan.findMany({
        where: kematianFarmFilter,
        select: { hewanId: true },
      }),
      prisma.hewan.findMany({
        where: farmFilter,
        select: { id: true, tanggalLahir: true },
      }),
      prisma.hewan.findMany({
        where: { berat: { not: null }, ...farmFilter },
        select: { id: true, berat: true },
      }),
    ])

    // ── Derived calculations ──
    const totalHidup = totalHewan - mati
    const mortalityRate = totalHewan > 0 ? Math.round((mati / totalHewan) * 100) : 0
    const totalReproduksiSelesai = totalLahir + totalGagal
    const birthSuccessRate = totalReproduksiSelesai > 0
      ? Math.round((totalLahir / totalReproduksiSelesai) * 100)
      : 0

    // Distribusi umur
    const matiIdSet = new Set(hewanMatiIds.map(k => k.hewanId))
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

    // Rata-rata berat (exclude dead animals)
    const livingWeights = allWeights.filter(h => !matiIdSet.has(h.id))
    const avgBerat = livingWeights.length > 0
      ? Math.round((livingWeights.reduce((a, h) => a + (h.berat || 0), 0) / livingWeights.length) * 10) / 10
      : 0

    // Kategori data (hidup saja)
    // Reuse the existing groupBy but filter out dead
    const kategoriCounts = await prisma.hewan.groupBy({
      by: ['kategori'],
      _count: true,
      where: { id: { notIn: [...matiIdSet] }, ...farmFilter },
    })
    const kategoriData = kategoriCounts.map(k => ({
      name: k.kategori === 'INDUKAN' ? 'Indukan'
        : k.kategori === 'PEJANTAN' ? 'Pejantan'
        : k.kategori === 'ANAKAN' ? 'Anakan'
        : k.kategori === 'DARA' ? 'Dara'
        : 'Jantan Muda',
      value: k._count,
    })).filter(k => k.value > 0)

    return {
      totalHewan: totalHidup,
      indukan,
      pejantan,
      mati,
      mortalityRate,
      birthSuccessRate,
      totalLahir,
      totalGagal,
      avgBerat,
      kategoriData,
      distribusiUmur,
      kategoriStats,
      reproduksiHamil,
      notifikasiMedis,
    }
  },
  ['dashboard-stats'],
  { revalidate: REVALIDATE_SHORT, tags: [CACHE_TAGS.dashboard] }
)

// ─── DASHBOARD TREND DATA (time-series, heavier query) ──────
export const getCachedDashboardTrends = unstable_cache(
  async (farmId: string | null) => {
    const farmFilter = farmId ? { farmId } : {}
    const kematianFarmFilter = farmId ? { hewan: { farmId } } : {}
    const medisFarmFilter = farmId ? { hewan: { farmId } } : {}

    const twoYearsAgo = new Date()
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
    twoYearsAgo.setHours(0, 0, 0, 0)

    const [trendRaw, kematianTrendRaw, beratRaw, diagnosisRaw] = await Promise.all([
      prisma.hewan.findMany({
        where: { createdAt: { gte: twoYearsAgo }, ...farmFilter },
        select: { createdAt: true },
      }),
      prisma.kematianHewan.findMany({
        where: { tanggalMati: { gte: twoYearsAgo }, ...kematianFarmFilter },
        select: { tanggalMati: true },
      }),
      prisma.beratBadan.findMany({
        where: { tanggal: { gte: twoYearsAgo }, hewan: farmFilter },
        select: { tanggal: true, berat: true },
        orderBy: { tanggal: 'asc' },
        take: 1000,
      }),
      prisma.rekamMedis.findMany({
        where: { ...medisFarmFilter, tanggal: { gte: twoYearsAgo } },
        select: { diagnosis: true, tanggal: true },
      }),
    ])

    return {
      trendRaw: trendRaw.map(h => ({ createdAt: h.createdAt.toISOString(), status: 'AKTIF' })),
      kematianTrendRaw: kematianTrendRaw.map(k => ({ tanggalMati: k.tanggalMati.toISOString() })),
      beratRaw: beratRaw.map(b => ({ tanggal: b.tanggal.toISOString(), berat: b.berat })),
      diagnosisRaw: diagnosisRaw.map(d => ({ diagnosis: d.diagnosis, tanggal: d.tanggal.toISOString() })),
    }
  },
  ['dashboard-trends'],
  { revalidate: REVALIDATE_SHORT, tags: [CACHE_TAGS.dashboard] }
)

// ─── ADMIN DASHBOARD ──────────────────────────────────────────
export const getCachedAdminDashboard = unstable_cache(
  async () => {
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // ── ALL stats + trends in ONE batch ──
    const [
      totalFarm, farmAktif, totalUser, totalHewan, totalMati,
      pendingApprovals, totalOwner,
      farmBulanIni, farmBulanLalu, userBulanIni, userBulanLalu,
      hewanMasukBulanIni, hewanMasukBulanLalu,
      hewanMatiBulanIni, hewanMatiBulanLalu,
      totalLahir, totalGagal, totalHamil,
      kategoriStats,
    ] = await Promise.all([
      prisma.farm.count(),
      prisma.farm.count({ where: { status: 'AKTIF' } }),
      prisma.user.count({ where: { deletedAt: null, approvalStatus: 'APPROVED' } }),
      prisma.hewan.count(),
      prisma.kematianHewan.count(),
      prisma.farm.count({ where: { status: 'NONAKTIF', deletedAt: null, rejectionReason: null } }),
      prisma.user.count({ where: { role: 'OWNER', deletedAt: null } }),
      // Trends
      prisma.farm.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.farm.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.user.count({ where: { createdAt: { gte: thisMonthStart }, deletedAt: null } }),
      prisma.user.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd }, deletedAt: null } }),
      prisma.hewan.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.hewan.count({ where: { createdAt: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      prisma.kematianHewan.count({ where: { tanggalMati: { gte: thisMonthStart } } }),
      prisma.kematianHewan.count({ where: { tanggalMati: { gte: lastMonthStart, lte: lastMonthEnd } } }),
      // Reproduksi
      prisma.reproduksi.count({ where: { status: 'LAHIR' } }),
      prisma.reproduksi.count({ where: { status: 'GAGAL' } }),
      prisma.reproduksi.count({ where: { status: 'HAMIL' } }),
      // Kategori
      prisma.hewan.groupBy({ by: ['kategori'], _count: true }),
    ])

    // ── Second batch: heavier queries ──
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

    const [hewanBaru, kematianBaru, farms, allMedis, recentPending] = await Promise.all([
      prisma.hewan.findMany({
        where: { createdAt: { gte: sixMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.kematianHewan.findMany({
        where: { tanggalMati: { gte: sixMonthsAgo } },
        select: { tanggalMati: true },
      }),
      prisma.farm.findMany({
        select: {
          id: true, nama: true, status: true, updatedAt: true,
          _count: { select: { hewan: true, members: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.rekamMedis.findMany({
        select: { diagnosis: true },
        take: 500,
      }),
      prisma.farm.findMany({
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
      }),
    ])

    // ── Kematian per farm (batch query instead of N queries) ──
    const allFarmIds = farms.map(f => f.id)
    const kematianPerFarm = await prisma.kematianHewan.groupBy({
      by: ['hewanId'],
      where: { hewan: { farmId: { in: allFarmIds } } },
    })
    // We need farm-level counts, so let's get hewan→farm mapping
    const hewanFarmMap = await prisma.hewan.findMany({
      where: { id: { in: kematianPerFarm.map(k => k.hewanId) } },
      select: { id: true, farmId: true },
    })
    const hewanFarmLookup = new Map(hewanFarmMap.map(h => [h.id, h.farmId]))
    const farmKematianMap = new Map<string, number>()
    kematianPerFarm.forEach(k => {
      const fId = hewanFarmLookup.get(k.hewanId)
      if (fId) farmKematianMap.set(fId, (farmKematianMap.get(fId) || 0) + 1)
    })

    // Inactive farm detection — use latest hewan activity
    const latestActivity = await prisma.hewan.findMany({
      where: { farm: { status: 'AKTIF' } },
      select: { farmId: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    })
    const latestPerFarm = new Map<string, Date>()
    latestActivity.forEach(h => {
      const existing = latestPerFarm.get(h.farmId)
      if (!existing || h.updatedAt > existing) latestPerFarm.set(h.farmId, h.updatedAt)
    })

    // ── Compute derived data ──
    function calcDelta(curr: number, prev: number) {
      if (prev === 0) return curr > 0 ? 100 : 0
      return Math.round(((curr - prev) / prev) * 100)
    }

    const mortalityRate = totalHewan > 0 ? Math.round((totalMati / totalHewan) * 100) : 0
    const totalReproduksiSelesai = totalLahir + totalGagal
    const birthSuccessRate = totalReproduksiSelesai > 0
      ? Math.round((totalLahir / totalReproduksiSelesai) * 100) : 0

    const trend = {
      farm: { curr: farmBulanIni, delta: calcDelta(farmBulanIni, farmBulanLalu) },
      user: { curr: userBulanIni, delta: calcDelta(userBulanIni, userBulanLalu) },
      hewanMasuk: { curr: hewanMasukBulanIni, delta: calcDelta(hewanMasukBulanIni, hewanMasukBulanLalu) },
      hewanMati: { curr: hewanMatiBulanIni, delta: calcDelta(hewanMatiBulanIni, hewanMatiBulanLalu) },
    }

    // Trend populasi 6 bulan
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
    const trendMap = new Map<string, { masuk: number; keluar: number }>()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(); d.setMonth(d.getMonth() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      trendMap.set(key, { masuk: 0, keluar: 0 })
    }
    hewanBaru.forEach(h => {
      const key = `${h.createdAt.getFullYear()}-${String(h.createdAt.getMonth() + 1).padStart(2, '0')}`
      const entry = trendMap.get(key); if (entry) entry.masuk++
    })
    kematianBaru.forEach(k => {
      const key = `${k.tanggalMati.getFullYear()}-${String(k.tanggalMati.getMonth() + 1).padStart(2, '0')}`
      const entry = trendMap.get(key); if (entry) entry.keluar++
    })
    const trendData = Array.from(trendMap.entries()).map(([key, val]) => {
      const m = key.split('-')[1]
      return { label: monthNames[parseInt(m) - 1], ...val }
    })

    // Farm comparison
    const farmsWithHealth = farms.map(f => {
      const mati = farmKematianMap.get(f.id) ?? 0
      const total = f._count.hewan
      const hidup = total - mati
      const healthScore = total > 0 ? Math.round((hidup / total) * 100) : 100
      const mortalityRateFarm = total > 0 ? Math.round((mati / total) * 100) : 0
      return { ...f, aktif: hidup, mati, total, healthScore, mortalityRateFarm }
    })
    const farmComparison = farmsWithHealth.map(f => ({
      id: f.id,
      nama: f.nama.length > 18 ? f.nama.slice(0, 18) + '…' : f.nama,
      namaPanjang: f.nama,
      hewan: f._count.hewan,
      user: f._count.members,
      status: f.status,
      healthScore: f.healthScore,
      mortalityRateFarm: f.mortalityRateFarm,
    }))

    // Inactive farms
    const inactiveFarms = farmsWithHealth
      .filter(f => f.status === 'AKTIF')
      .filter(f => {
        const lastAct = latestPerFarm.get(f.id)
        return !lastAct || lastAct < thirtyDaysAgo
      })
      .map(f => ({
        id: f.id, nama: f.nama,
        reason: latestPerFarm.get(f.id)
          ? `Tidak ada aktivitas ${Math.floor((now.getTime() - latestPerFarm.get(f.id)!.getTime()) / (1000 * 60 * 60 * 24))} hari`
          : 'Belum ada data hewan',
      }))

    // High mortality alerts
    const highMortalityFarms = farmsWithHealth
      .filter(f => f.mortalityRateFarm > 20 && f.total > 0 && f.status === 'AKTIF')
      .map(f => ({ id: f.id, nama: f.nama, mortalityRate: f.mortalityRateFarm }))
      .slice(0, 5)

    // Kategori data
    const kategoriData = kategoriStats.map(k => ({
      name: k.kategori === 'INDUKAN' ? 'Indukan'
        : k.kategori === 'PEJANTAN' ? 'Pejantan'
        : k.kategori === 'ANAKAN' ? 'Anakan'
        : k.kategori === 'DARA' ? 'Dara'
        : 'Jantan Muda',
      value: k._count,
    })).filter(k => k.value > 0)

    // Top diagnosa
    const diagnosisCount = new Map<string, number>()
    allMedis.forEach(m => {
      const d = m.diagnosis.trim()
      if (d) diagnosisCount.set(d, (diagnosisCount.get(d) || 0) + 1)
    })
    const topDiagnosa = Array.from(diagnosisCount.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 6)
      .map(([name, count]) => ({ name, count }))

    // Farm alerts
    const farmAlerts: { id: string; nama: string; reason: string }[] = []
    farms.forEach(f => {
      if (f.status === 'NONAKTIF') farmAlerts.push({ id: f.id, nama: f.nama, reason: 'Farm Nonaktif' })
      else if (f._count.hewan === 0) farmAlerts.push({ id: f.id, nama: f.nama, reason: 'Tidak ada hewan' })
    })

    return {
      stats: {
        totalFarm, farmAktif, totalUser, totalHewan,
        mortalityRate, pendingApprovals, totalOwner,
        birthSuccessRate, totalHamil,
      },
      trend,
      trendData,
      farmComparison,
      kategoriData,
      topDiagnosa,
      farmAlerts,
      inactiveFarms,
      highMortalityFarms,
      recentPending: recentPending.map(farm => ({
        id: farm.id,
        name: farm.members[0]?.user?.name ?? '(Owner)',
        email: farm.members[0]?.user?.email ?? '',
        createdAt: farm.createdAt.toISOString(),
      })),
    }
  },
  ['admin-dashboard'],
  { revalidate: REVALIDATE_SHORT, tags: [CACHE_TAGS.admin] }
)

// ─── ADMIN ANALYTICS ──────────────────────────────────────────
export const getCachedAdminAnalytics = unstable_cache(
  async () => {
    const farms = await prisma.farm.findMany({
      select: { id: true, nama: true, status: true },
      orderBy: { createdAt: 'asc' },
    })

    // ── ONE groupBy instead of N×6 individual queries ──
    const [hewanGrouped, reproduksiGrouped, hewanMatiIds, allHewan, allMedis] = await Promise.all([
      prisma.hewan.groupBy({
        by: ['farmId', 'kategori'],
        _count: true,
      }),
      prisma.reproduksi.groupBy({
        by: ['status'],
        _count: true,
        where: { induk: { farmId: { in: farms.map(f => f.id) } } },
      }),
      prisma.kematianHewan.findMany({ select: { hewanId: true } }),
      prisma.hewan.findMany({ select: { id: true, tanggalLahir: true, farmId: true } }),
      prisma.rekamMedis.findMany({
        select: { diagnosis: true, kategori: true },
        take: 1000,
      }),
    ])

    // Also get reproduksi grouped by farm
    const reproduksiByFarm = await prisma.$queryRawUnsafe<Array<{ farmId: string; status: string; count: bigint }>>(
      `SELECT h."farmId", r."status", COUNT(*)::bigint as count
       FROM "Reproduksi" r
       JOIN "Hewan" h ON r."indukId" = h."id"
       GROUP BY h."farmId", r."status"`
    )

    // Kematian per farm via groupBy
    const kematianGrouped = await prisma.$queryRawUnsafe<Array<{ farmId: string; count: bigint }>>(
      `SELECT h."farmId", COUNT(*)::bigint as count
       FROM "KematianHewan" k
       JOIN "Hewan" h ON k."hewanId" = h."id"
       GROUP BY h."farmId"`
    )
    const kematianMap = new Map(kematianGrouped.map(k => [k.farmId, Number(k.count)]))

    // Build hewanPerFarm from groupBy results
    const hewanPerFarm = farms.map(farm => {
      const farmHewan = hewanGrouped.filter(h => h.farmId === farm.id)
      const getCount = (kategori: string) => farmHewan.find(h => h.kategori === kategori)?._count ?? 0
      const totalHewan = farmHewan.reduce((sum, h) => sum + h._count, 0)
      const mati = kematianMap.get(farm.id) ?? 0
      return {
        id: farm.id,
        nama: farm.nama.length > 14 ? farm.nama.slice(0, 14) + '…' : farm.nama,
        namaPanjang: farm.nama,
        status: farm.status,
        indukan: getCount('INDUKAN'),
        pejantan: getCount('PEJANTAN'),
        anakan: getCount('ANAKAN'),
        dara: getCount('DARA'),
        jantanMuda: getCount('JANTAN_MUDA'),
        total: totalHewan - mati,
        mati,
        terjual: 0,
        mortalityRate: totalHewan > 0 ? Math.round((mati / totalHewan) * 100) : 0,
      }
    })

    // Build reproduksiPerFarm from raw query
    const reproduksiPerFarm = farms.map(farm => {
      const farmReproduksi = reproduksiByFarm.filter(r => r.farmId === farm.id)
      const getCount = (status: string) => Number(farmReproduksi.find(r => r.status === status)?.count ?? 0)
      const lahir = getCount('LAHIR')
      const gagal = getCount('GAGAL')
      const total = lahir + gagal
      return {
        nama: farm.nama.length > 14 ? farm.nama.slice(0, 14) + '…' : farm.nama,
        namaPanjang: farm.nama,
        lahir,
        gagal,
        hamil: getCount('HAMIL'),
        successRate: total > 0 ? Math.round((lahir / total) * 100) : 0,
      }
    })

    // Distribusi umur
    const matiIdSet = new Set(hewanMatiIds.map(k => k.hewanId))
    const allHewanHidup = allHewan.filter(h => !matiIdSet.has(h.id))
    const now = new Date()
    const ageGroups: Record<string, number> = { '0–6 bln': 0, '6–12 bln': 0, '1–2 thn': 0, '2–3 thn': 0, '3+ thn': 0 }
    allHewanHidup.forEach(h => {
      const months = (now.getTime() - h.tanggalLahir.getTime()) / (1000 * 60 * 60 * 24 * 30.44)
      if (months < 6) ageGroups['0–6 bln']++
      else if (months < 12) ageGroups['6–12 bln']++
      else if (months < 24) ageGroups['1–2 thn']++
      else if (months < 36) ageGroups['2–3 thn']++
      else ageGroups['3+ thn']++
    })
    const distribusiUmur = Object.entries(ageGroups)
      .map(([name, value]) => ({ name, value }))
      .filter(d => d.value > 0)

    // Top diagnosa + kategori medis
    const diagMap = new Map<string, number>()
    const kategoriMedisMap = new Map<string, number>()
    allMedis.forEach(m => {
      const d = m.diagnosis.trim()
      if (d) diagMap.set(d, (diagMap.get(d) || 0) + 1)

      let name: string = m.kategori as string
      if (name === 'VAKSINASI') name = 'Vaksinasi'
      else if (name === 'PENGOBATAN') name = 'Pengobatan'
      else if (name === 'PEMERIKSAAN') name = 'Pemeriksaan'
      else if (name === 'PERAWATAN_LUKA') name = 'Perawatan Luka'
      else if (name === 'VITAMIN') name = 'Vitamin'
      else name = 'Lainnya'
      kategoriMedisMap.set(name, (kategoriMedisMap.get(name) || 0) + 1)
    })
    const topDiagnosa = Array.from(diagMap.entries())
      .sort((a, b) => b[1] - a[1]).slice(0, 8)
      .map(([name, count]) => ({ name, count }))
    const kategoriMedisData = Array.from(kategoriMedisMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

    return { hewanPerFarm, reproduksiPerFarm, distribusiUmur, topDiagnosa, kategoriMedisData }
  },
  ['admin-analytics'],
  { revalidate: REVALIDATE_LONG, tags: [CACHE_TAGS.admin] }
)
