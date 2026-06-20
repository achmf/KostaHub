import { prisma } from '@/lib/prisma'
import AdminPrintClient from '@/components/Admin/AdminPrintClient'

export const metadata = { title: 'Cetak Laporan — Admin KostaHub' }

export default async function PrintPage() {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalFarm,
    farmAktif,
    totalUser,
    totalHewan,
    totalMati,
    totalTerjual,
    pendingApprovals,
    farmBulanIni,
    hewanBulanIni,
  ] = await Promise.all([
    prisma.farm.count(),
    prisma.farm.count({ where: { status: 'AKTIF' } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.hewan.count({ where: { status: 'AKTIF' } }),
    prisma.hewan.count({ where: { status: 'MATI' } }),
    prisma.hewan.count({ where: { status: 'TERJUAL' } }),
    prisma.farm.count({ where: { status: 'NONAKTIF', deletedAt: null, rejectionReason: null } }),
    prisma.farm.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.hewan.count({ where: { createdAt: { gte: thisMonthStart } } }),
  ])

  const totalSemua = totalHewan + totalMati + totalTerjual
  const mortalityRate = totalSemua > 0 ? Math.round((totalMati / totalSemua) * 100) : 0

  const [totalLahir, totalGagal] = await Promise.all([
    prisma.reproduksi.count({ where: { status: 'LAHIR' } }),
    prisma.reproduksi.count({ where: { status: 'GAGAL' } }),
  ])
  const totalRepro = totalLahir + totalGagal
  const birthSuccessRate = totalRepro > 0 ? Math.round((totalLahir / totalRepro) * 100) : 0

  const farms = await prisma.farm.findMany({
    select: {
      id: true, nama: true, status: true, alamat: true, createdAt: true,
      _count: { select: { hewan: true, members: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const kategoriStats = await prisma.hewan.groupBy({
    by: ['kategori'],
    _count: true,
    where: { status: 'AKTIF' },
  })

  return (
    <AdminPrintClient
      reportDate={now.toISOString()}
      stats={{
        totalFarm, farmAktif, totalUser, totalHewan,
        totalMati, totalTerjual, mortalityRate,
        pendingApprovals, farmBulanIni, hewanBulanIni,
        birthSuccessRate,
      }}
      farms={farms.map((f) => ({
        id: f.id, nama: f.nama, status: f.status,
        alamat: f.alamat ?? '',
        hewan: f._count.hewan,
        members: f._count.members,
        createdAt: f.createdAt.toISOString(),
      }))}
      kategoriData={kategoriStats.map((k) => ({ name: k.kategori, value: k._count }))}
    />
  )
}
