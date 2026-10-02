import AdminDashboardClient from '@/components/Admin/AdminDashboardClient'
import AdminAnalyticsClient from '@/components/Admin/AdminAnalyticsClient'
import { getCachedAdminDashboard, getCachedAdminAnalytics } from '@/lib/cached-queries'

export default async function AdminPage() {
  const [dashboardData, analyticsData] = await Promise.all([
    getCachedAdminDashboard(),
    getCachedAdminAnalytics(),
  ])

  return (
    <div className="flex flex-col gap-10">
      <AdminDashboardClient
        stats={dashboardData.stats}
        trend={dashboardData.trend}
        trendData={dashboardData.trendData}
        farmComparison={dashboardData.farmComparison}
        kategoriData={dashboardData.kategoriData}
        topDiagnosa={dashboardData.topDiagnosa}
        farmAlerts={dashboardData.farmAlerts}
        inactiveFarms={dashboardData.inactiveFarms}
        highMortalityFarms={dashboardData.highMortalityFarms}
        recentPending={dashboardData.recentPending}
      />
      
      <div id="analytics" className="pt-6 border-t" style={{ borderColor: 'rgba(13,20,15,0.1)' }}>
        <AdminAnalyticsClient
          hewanPerFarm={analyticsData.hewanPerFarm}
          reproduksiPerFarm={analyticsData.reproduksiPerFarm}
          distribusiUmur={analyticsData.distribusiUmur}
          topDiagnosa={analyticsData.topDiagnosa}
          kategoriMedisData={analyticsData.kategoriMedisData}
          hideHeader={true}
        />
      </div>
    </div>
  )
}
