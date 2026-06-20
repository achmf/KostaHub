import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminMapClient from '@/components/Admin/AdminMapClient'

export const dynamic = 'force-dynamic'

export default async function AdminMapPage() {
  const session = await getSession()
  if (!session || session.role !== 'SUPER_ADMIN') redirect('/admin')

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
        take: 1,
      },
      hewan: {
        select: { status: true, kategori: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const farms = rawFarms.map((f) => {
    const totalHewan = f.hewan.length
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
      _count: { hewan: totalHewan },
      hewanAktif: f.hewan.filter((h) => h.status === 'AKTIF').length,
      hewanMati: f.hewan.filter((h) => h.status === 'MATI').length,
      hewanIndukan: f.hewan.filter((h) => h.kategori === 'INDUKAN').length,
      hewanPejantan: f.hewan.filter((h) => h.kategori === 'PEJANTAN').length,
    }
  })

  // Unique owner list for filter dropdown
  const ownerSet = new Set<string>()
  rawFarms.forEach((f) => {
    const name = f.members[0]?.user.name
    if (name) ownerSet.add(name)
  })
  const owners = Array.from(ownerSet)

  return <AdminMapClient farms={farms} owners={owners} />
}
