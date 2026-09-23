import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MapPageClient from '@/components/Map/MapPageClient'

export default async function MapPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')
  if (session.role === 'PETUGAS') redirect('/')

  let rawFarms: Awaited<ReturnType<typeof prisma.farm.findMany>>
  const hewanByFarm: Record<string, { kematian: { hewanId: string } | null; kategori: string }[]> = {}

  if (session.role === 'SUPER_ADMIN') {
    const farmId = searchParams.farmId
    const farmWhere = farmId ? { id: farmId, deletedAt: null } : { deletedAt: null }
    // Parallel: farms + hewan in one batch
    const [farms, hewanList] = await Promise.all([
      prisma.farm.findMany({ where: farmWhere }),
      prisma.hewan.findMany({
        where: farmId ? { farmId } : {},
        select: { farmId: true, kematian: { select: { hewanId: true } }, kategori: true },
      }),
    ])
    rawFarms = farms
    for (const h of hewanList) {
      if (!hewanByFarm[h.farmId]) hewanByFarm[h.farmId] = []
      hewanByFarm[h.farmId].push({ kematian: h.kematian, kategori: h.kategori })
    }
  } else {
    // Owner/Petugas/Dokter: single query with nested includes instead of 3 sequential queries
    const userFarms = await prisma.userFarm.findMany({
      where: { userId: session.id },
      include: {
        farm: true,
      },
    })
    rawFarms = userFarms
      .map(uf => uf.farm)
      .filter(f => f.deletedAt === null)

    if (rawFarms.length > 0) {
      const farmIds = rawFarms.map(f => f.id)
      const hewanList = await prisma.hewan.findMany({
        where: { farmId: { in: farmIds } },
        select: { farmId: true, kematian: { select: { hewanId: true } }, kategori: true },
      })
      for (const h of hewanList) {
        if (!hewanByFarm[h.farmId]) hewanByFarm[h.farmId] = []
        hewanByFarm[h.farmId].push({ kematian: h.kematian, kategori: h.kategori })
      }
    }
  }

  const farms = rawFarms.map(f => {
    const hewan = hewanByFarm[f.id] ?? []
    return {
      id: f.id,
      nama: f.nama,
      alamat: f.alamat,
      lat: f.lat,
      lng: f.lng,
      geojson: f.geojson,
      deskripsi: f.deskripsi,
      status: f.status as string,
      _count: { hewan: hewan.length },
      hewanAktif: hewan.filter(h => !h.kematian).length,
      hewanMati: hewan.filter(h => !!h.kematian).length,
      hewanIndukan: hewan.filter(h => h.kategori === 'INDUKAN').length,
      hewanPejantan: hewan.filter(h => h.kategori === 'PEJANTAN').length,
    }
  })

  return <MapPageClient farms={farms} role={session.role} />
}
