import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MapPageClient from '@/components/Map/MapPageClient'

export default async function MapPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let rawFarms: Awaited<ReturnType<typeof prisma.farm.findMany>>
  let hewanByFarm: Record<string, { status: string; kategori: string }[]> = {}

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
      select: { farmId: true, status: true, kategori: true },
    })
    for (const h of hewanList) {
      if (!hewanByFarm[h.farmId]) hewanByFarm[h.farmId] = []
      hewanByFarm[h.farmId].push({ status: h.status, kategori: h.kategori })
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
      hewanAktif: hewan.filter(h => h.status === 'AKTIF').length,
      hewanMati: hewan.filter(h => h.status === 'MATI').length,
      hewanIndukan: hewan.filter(h => h.kategori === 'INDUKAN').length,
      hewanPejantan: hewan.filter(h => h.kategori === 'PEJANTAN').length,
    }
  })

  return <MapPageClient farms={farms} role={session.role} />
}
