import AdminAnalyticsClient from '@/components/Admin/AdminAnalyticsClient'
import { getCachedAdminAnalytics } from '@/lib/cached-queries'

export default async function AdminAnalyticsPage() {
  const data = await getCachedAdminAnalytics()

  return (
    <AdminAnalyticsClient
      hewanPerFarm={data.hewanPerFarm}
      reproduksiPerFarm={data.reproduksiPerFarm}
      distribusiUmur={data.distribusiUmur}
      topDiagnosa={data.topDiagnosa}
      kategoriMedisData={data.kategoriMedisData}
    />
  )
}
