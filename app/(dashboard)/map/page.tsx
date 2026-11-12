import { prisma } from '@/lib/prisma'
import { getFarmSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MapPageClient from '@/components/Map/MapPageClient'

export default async function MapPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const session = await getFarmSession()
  if (!session) redirect('/login')
  if (session.role === 'PETUGAS') redirect('/')

  let rawFarms: Awaited<ReturnType<typeof prisma.farm.findMany>>
  let hewanWhere: { farmId?: string | { in: string[] } } = {}

  if (session.role === 'SUPER_ADMIN') {
    const farmId = searchParams.farmId
    const farmWhere = farmId ? { id: farmId, deletedAt: null } : { deletedAt: null }
    rawFarms = await prisma.farm.findMany({ where: farmWhere })
    if (farmId) hewanWhere = { farmId }
  } else {
    // Owner/Petugas/Dokter
    const userFarms = await prisma.userFarm.findMany({
      where: { userId: session.id },
      include: {
        farm: true,
      },
    })
    rawFarms = userFarms
      .map(uf => uf.farm)
      .filter(f => f.deletedAt === null)
    hewanWhere = { farmId: { in: rawFarms.map(f => f.id) } }
  }

  // Hitung di database: hewan hidup per farm+kategori, dan hewan mati per farm
  const [hidupGrouped, matiGrouped] = rawFarms.length > 0
    ? await Promise.all([
        prisma.hewan.groupBy({ by: ['farmId', 'kategori'], where: { kematian: { is: null }, ...hewanWhere }, _count: true }),
        prisma.hewan.groupBy({ by: ['farmId'], where: { kematian: { isNot: null }, ...hewanWhere }, _count: true }),
      ])
    : [[], []]
  const hidupFarm = new Map<string, number>()
  const hidupKategori = new Map<string, number>()
  for (const g of hidupGrouped) {
    hidupFarm.set(g.farmId, (hidupFarm.get(g.farmId) ?? 0) + g._count)
    hidupKategori.set(`${g.farmId}:${g.kategori}`, g._count)
  }
  const matiFarm = new Map(matiGrouped.map((g) => [g.farmId, g._count]))

  const farms = rawFarms.map(f => {
    const hidup = hidupFarm.get(f.id) ?? 0
    return {
      id: f.id,
      nama: f.nama,
      alamat: f.alamat,
      lat: f.lat,
      lng: f.lng,
      geojson: f.geojson,
      deskripsi: f.deskripsi,
      status: f.status as string,
      _count: { hewan: hidup },
      hewanAktif: hidup,
      hewanMati: matiFarm.get(f.id) ?? 0,
      hewanIndukan: hidupKategori.get(`${f.id}:INDUKAN`) ?? 0,
      hewanPejantan: hidupKategori.get(`${f.id}:PEJANTAN`) ?? 0,
    }
  })

  return <MapPageClient farms={farms} role={session.role} />
}
