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
    // Super admin: lihat semua farm atau filter by farmId query param
    const farmId = searchParams.farmId
    rawFarms = farmId
      ? await prisma.farm.findMany({ where: { id: farmId, deletedAt: null } })
      : await prisma.farm.findMany({ where: { deletedAt: null } })
  } else {
    // Owner/Petugas/Dokter: ambil SEMUA farm via UserFarm relation — bukan hanya activeFarmId
    const userFarms = await prisma.userFarm.findMany({
      where: { userId: session.id },
      select: { farmId: true },
    })
    const farmIds = userFarms.map(uf => uf.farmId)
    rawFarms = farmIds.length > 0
      ? await prisma.farm.findMany({ where: { id: { in: farmIds }, deletedAt: null } })
      : []
  }

  // Fetch hewan counts per farm
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
