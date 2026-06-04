import { PrismaClient } from '@prisma/client'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LaporanClient from './LaporanClient'

const prisma = new PrismaClient()

export default async function LaporanPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await getSession()
  if (!session) redirect('/login')
  const searchParams = await props.searchParams

  let farmId = session.farmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }

  const farmFilter = farmId ? { id: farmId } : {}
  const hewanFarmFilter = farmId ? { farmId } : {}
  const medisFarmFilter = farmId ? { hewan: { farmId } } : {}
  const reproduksiFarmFilter = farmId ? { induk: { farmId } } : {}
  const mutasiFarmFilter = farmId ? { fromFarmId: farmId } : {} // Assuming we care about mutations FROM this farm or we could do OR condition

  const isGlobal = !farmId
  let farmName = ''
  if (farmId) {
    const f = await prisma.farm.findUnique({ where: { id: farmId }, select: { nama: true } })
    if (f) farmName = f.nama
  }

  // 1. Chart Data: Perbandingan Populasi Farm
  const farms = await prisma.farm.findMany({
    where: { status: 'AKTIF', ...farmFilter },
    include: {
      _count: {
        select: {
          hewan: { where: { status: 'AKTIF' } }
        }
      }
    }
  })
  
  const farmChartData = farms.map(f => ({
    name: f.nama,
    populasi: f._count.hewan
  }))

  // 2. Chart Data: Distribusi Kategori Hewan
  const totalIndukan = await prisma.hewan.count({ where: { kategori: 'INDUKAN', status: 'AKTIF', ...hewanFarmFilter } })
  const totalPejantan = await prisma.hewan.count({ where: { kategori: 'PEJANTAN', status: 'AKTIF', ...hewanFarmFilter } })
  const totalAnakan = await prisma.hewan.count({ where: { kategori: 'ANAKAN', status: 'AKTIF', ...hewanFarmFilter } })
  const kategoriChartData = [
    { name: 'Indukan', value: totalIndukan },
    { name: 'Pejantan', value: totalPejantan },
    { name: 'Anakan', value: totalAnakan }
  ]

  // 3. Chart Data: Kasus Medis per Farm
  const medisPerFarm = await prisma.farm.findMany({
    where: { status: 'AKTIF', ...farmFilter },
    select: {
      nama: true,
      hewan: {
        select: {
          _count: {
            select: { rekamMedis: true }
          }
        }
      }
    }
  })
  
  const medisChartData = medisPerFarm.map(f => ({
    name: f.nama,
    kasus: f.hewan.reduce((acc, h) => acc + h._count.rekamMedis, 0)
  }))

  // 4. Tab Data: Detail Populasi Terkini (Take 50)
  const populasiData = await prisma.hewan.findMany({
    where: { status: 'AKTIF', ...hewanFarmFilter },
    include: { farm: { select: { nama: true } } },
    orderBy: { createdAt: 'desc' },
    take: 50
  })

  // 5. Tab Data: Detail Medis (Take 50)
  const medisData = await prisma.rekamMedis.findMany({
    where: medisFarmFilter,
    include: { hewan: { select: { tag: true, farm: { select: { nama: true } } } } },
    orderBy: { tanggal: 'desc' },
    take: 50
  })

  // 6. Tab Data: Detail Reproduksi (Take 50)
  const reproduksiData = await prisma.reproduksi.findMany({
    where: reproduksiFarmFilter,
    include: {
      induk: { select: { tag: true, farm: { select: { nama: true } } } },
      pejantan: { select: { tag: true } }
    },
    orderBy: { tanggalKawin: 'desc' },
    take: 50
  })

  // 7. Tab Data: Detail Mutasi (Transfer) (Take 50)
  const mutasiData = await prisma.transferHewan.findMany({
    where: farmId ? { OR: [{ fromFarmId: farmId }, { toFarmId: farmId }] } : {},
    include: {
      hewan: { select: { tag: true } },
      fromFarm: { select: { nama: true } },
      toFarm: { select: { nama: true } }
    },
    orderBy: { tanggal: 'desc' },
    take: 50
  })

  const data = {
    farmChartData,
    kategoriChartData,
    medisChartData,
    populasiData,
    medisData,
    reproduksiData,
    mutasiData
  }

  return <LaporanClient data={data} isGlobal={isGlobal} farmName={farmName} />
}
