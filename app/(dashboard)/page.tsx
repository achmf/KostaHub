import { prisma } from '@/lib/prisma'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/Dashboard/DashboardClient'

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let farmId = session.farmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }
  const farmFilter = farmId ? { farmId } : {}

  const [
    totalHewan,
    indukan,
    pejantan,
    sedangSakit,
    mati,
    terjual,
    reproduksiHamil,
    notifikasiVaksin,
    kategoriStats,
    farmCount
  ] = await Promise.all([
    prisma.hewan.count({ where: { status: 'AKTIF', ...farmFilter } }),
    prisma.hewan.count({ where: { status: 'AKTIF', kategori: 'INDUKAN', ...farmFilter } }),
    prisma.hewan.count({ where: { status: 'AKTIF', kategori: 'PEJANTAN', ...farmFilter } }),
    prisma.hewan.count({
      where: { status: 'AKTIF', ...farmFilter }
    }),
    prisma.hewan.count({ where: { status: 'MATI', ...farmFilter } }),
    prisma.hewan.count({ where: { status: 'TERJUAL', ...farmFilter } }),
    prisma.reproduksi.findMany({
      where: {
        status: 'HAMIL',
        ...(farmId ? { induk: { is: { farmId } } } : {})
      },
      orderBy: { estimasiLahir: 'asc' },
      take: 5,
      include: { induk: true }
    }),
    prisma.notifikasi.findMany({
      where: {
        isRead: false,
        type: 'VAKSIN',
        ...(farmId ? { farmId } : {})
      },
      orderBy: { tanggal: 'asc' },
      take: 5
    }),
    prisma.hewan.groupBy({
      by: ['kategori'],
      _count: true,
      where: { status: 'AKTIF', ...farmFilter }
    }),
    session.role === 'SUPER_ADMIN' ? prisma.farm.count() : Promise.resolve(1)
  ])

  return (
    <DashboardClient
      stats={{ totalHewan, indukan, pejantan, sedangSakit, mati, terjual }}
      reproduksiHamil={reproduksiHamil.map(r => ({
        ...r,
        tanggalKawin: r.tanggalKawin.toISOString(),
        estimasiLahir: r.estimasiLahir.toISOString(),
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt.toISOString(),
        induk: {
          ...r.induk,
          tanggalLahir: r.induk.tanggalLahir.toISOString(),
          createdAt: r.induk.createdAt.toISOString(),
          updatedAt: r.induk.updatedAt.toISOString(),
        }
      }))}
      notifikasiVaksin={notifikasiVaksin.map(n => ({
        ...n,
        tanggal: n.tanggal.toISOString(),
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      }))}
      kategoriStats={kategoriStats}
      isSuperAdmin={session.role === 'SUPER_ADMIN'}
      farmCount={farmCount as number}
    />
  )
}
