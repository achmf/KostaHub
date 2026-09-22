import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardClient from '@/components/Dashboard/DashboardClient'
import { getCachedDashboardData, getCachedDashboardTrends } from '@/lib/cached-queries'
import { prisma } from '@/lib/prisma'

export default async function DashboardPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams
  const session = await getSession()
  if (!session) redirect('/login')

  let farmId = session.activeFarmId as string | null
  if (session.role === 'SUPER_ADMIN' && searchParams.farmId) {
    farmId = searchParams.farmId
  }

  // ── Fetch cached data + trends in parallel ──
  const [data, trends, farmCount] = await Promise.all([
    getCachedDashboardData(farmId),
    getCachedDashboardTrends(farmId),
    session.role === 'SUPER_ADMIN' ? prisma.farm.count() : Promise.resolve(1),
  ])

  return (
    <DashboardClient
      stats={{ totalHewan: data.totalHewan, indukan: data.indukan, pejantan: data.pejantan, sedangSakit: data.totalHewan, mati: data.mati, terjual: 0 }}
      reproduksiHamil={data.reproduksiHamil.map(r => ({
        ...r,
        tanggalKawin: new Date(r.tanggalKawin).toISOString(),
        estimasiLahir: new Date(r.estimasiLahir).toISOString(),
        createdAt: new Date(r.createdAt).toISOString(),
        updatedAt: new Date(r.updatedAt).toISOString(),
        induk: {
          ...r.induk,
          tanggalLahir: new Date(r.induk.tanggalLahir).toISOString(),
          createdAt: new Date(r.induk.createdAt).toISOString(),
          updatedAt: new Date(r.induk.updatedAt).toISOString(),
        },
      }))}
      notifikasiMedis={data.notifikasiMedis.map(n => ({
        ...n,
        tanggal: new Date(n.tanggal).toISOString(),
        createdAt: new Date(n.createdAt).toISOString(),
        updatedAt: new Date(n.updatedAt).toISOString(),
      }))}
      kategoriStats={data.kategoriStats}
      isSuperAdmin={session.role === 'SUPER_ADMIN'}
      farmCount={farmCount as number}
      overviewData={{
        mortalityRate: data.mortalityRate,
        birthSuccessRate: data.birthSuccessRate,
        totalLahir: data.totalLahir,
        totalGagal: data.totalGagal,
        totalHamil: data.reproduksiHamil.length,
        avgBerat: data.avgBerat,
        kategoriData: data.kategoriData,
        distribusiUmur: data.distribusiUmur,
      }}
      trendRaw={trends.trendRaw}
      kematianTrendRaw={trends.kematianTrendRaw}
      beratRaw={trends.beratRaw}
      diagnosisRaw={trends.diagnosisRaw}
    />
  )
}
