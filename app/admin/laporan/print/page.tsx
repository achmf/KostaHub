import { prisma } from '@/lib/prisma'
import AdminPrintClient from '@/components/Admin/AdminPrintClient'

export const metadata = { title: 'Cetak Laporan — Admin KostaHub' }

export default async function PrintPage() {
  const now = new Date()
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    totalFarm, farmAktif, totalUser, totalHewan, totalMati,
    pendingApprovals, farmBulanIni, hewanBulanIni,
    totalLahir, totalGagal,
    farms, kategoriStats,
  ] = await Promise.all([
    prisma.farm.count(),
    prisma.farm.count({ where: { status: 'AKTIF' } }),
    prisma.user.count({ where: { deletedAt: null } }),
    prisma.hewan.count({ where: { kematian: { is: null } } }),
    prisma.kematianHewan.count(),
    prisma.farm.count({ where: { status: 'NONAKTIF', deletedAt: null, rejectionReason: null } }),
    prisma.farm.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.hewan.count({ where: { createdAt: { gte: thisMonthStart } } }),
    prisma.reproduksi.count({ where: { status: 'LAHIR' } }),
    prisma.reproduksi.count({ where: { status: 'GAGAL' } }),
    prisma.farm.findMany({
      select: {
        id: true, nama: true, status: true, alamat: true, createdAt: true,
        _count: { select: { hewan: { where: { kematian: { is: null } } }, members: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.hewan.groupBy({ by: ['kategori'], _count: true, where: { kematian: { is: null } } }),
  ])

  // totalHewan hanya hewan hidup; penyebut = semua hewan yang pernah tercatat
  const mortalityRate = totalHewan + totalMati > 0 ? Math.round((totalMati / (totalHewan + totalMati)) * 100) : 0
  const totalRepro = totalLahir + totalGagal
  const birthSuccessRate = totalRepro > 0 ? Math.round((totalLahir / totalRepro) * 100) : 0

  return (
    <AdminPrintClient
      reportDate={now.toISOString()}
      stats={{
        totalFarm, farmAktif, totalUser, totalHewan,
        totalMati, mortalityRate,
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
