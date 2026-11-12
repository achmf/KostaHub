import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminMapClient from '@/components/Admin/AdminMapClient'

export const dynamic = 'force-dynamic'

export default async function AdminMapPage() {
  const session = await getSession()
  if (!session || (session.role !== 'SUPER_ADMIN' && session.role !== 'DINAS')) redirect('/admin')

  // Fetch ALL farms with owner info and per-status livestock counts
  const rawFarms = await prisma.farm.findMany({
    select: {
      id: true,
      nama: true,
      alamat: true,
      lat: true,
      lng: true,
      geojson: true,
      deskripsi: true,
      status: true,
      members: {
        select: { user: { select: { name: true } } },
        where: { user: { role: 'OWNER', deletedAt: null } },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Hitung di database: hewan hidup per farm+kategori, dan hewan mati per farm
  const [hidupGrouped, matiGrouped] = await Promise.all([
    prisma.hewan.groupBy({ by: ['farmId', 'kategori'], where: { kematian: { is: null } }, _count: true }),
    prisma.hewan.groupBy({ by: ['farmId'], where: { kematian: { isNot: null } }, _count: true }),
  ])
  const hidupFarm = new Map<string, number>()
  const hidupKategori = new Map<string, number>()
  for (const g of hidupGrouped) {
    hidupFarm.set(g.farmId, (hidupFarm.get(g.farmId) ?? 0) + g._count)
    hidupKategori.set(`${g.farmId}:${g.kategori}`, g._count)
  }
  const matiFarm = new Map(matiGrouped.map((g) => [g.farmId, g._count]))

  const farms = rawFarms.map((f) => {
    const hidup = hidupFarm.get(f.id) ?? 0
    return {
      id: f.id,
      nama: f.nama,
      alamat: f.alamat,
      lat: f.lat,
      lng: f.lng,
      geojson: f.geojson,
      deskripsi: f.deskripsi,
      status: f.status,
      ownerName: f.members[0]?.user.name ?? 'Tidak ada owner',
      _count: { hewan: hidup },
      hewanAktif: hidup,
      hewanMati: matiFarm.get(f.id) ?? 0,
      hewanIndukan: hidupKategori.get(`${f.id}:INDUKAN`) ?? 0,
      hewanPejantan: hidupKategori.get(`${f.id}:PEJANTAN`) ?? 0,
    }
  })


  // Unique owner list for filter dropdown
  const ownerSet = new Set<string>()
  rawFarms.forEach((f) => {
    const name = f.members[0]?.user.name
    if (name) ownerSet.add(name)
  })
  const owners = Array.from(ownerSet)

  return <AdminMapClient farms={farms} owners={owners} canEdit={session?.role === 'SUPER_ADMIN'} />
}
