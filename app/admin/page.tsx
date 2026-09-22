import AdminDashboardClient from '@/components/Admin/AdminDashboardClient'
import { getCachedAdminDashboard } from '@/lib/cached-queries'

export default async function AdminPage() {
  const data = await getCachedAdminDashboard()

  return (
    <AdminDashboardClient
      stats={data.stats}
      trend={data.trend}
      trendData={data.trendData}
      farmComparison={data.farmComparison}
      kategoriData={data.kategoriData}
      topDiagnosa={data.topDiagnosa}
      farmAlerts={data.farmAlerts}
      inactiveFarms={data.inactiveFarms}
      highMortalityFarms={data.highMortalityFarms}
      recentPending={data.recentPending}
    />
  )
}
