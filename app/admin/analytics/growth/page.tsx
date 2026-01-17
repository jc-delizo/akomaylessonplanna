import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { MetricCards } from '@/components/admin/dashboard/metric-cards'
import { AdminCharts } from '@/components/admin/dashboard/charts'

async function getGrowthAnalytics(timeRange: string = 'last_30_days') {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/analytics/growth?timeRange=${timeRange}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch growth analytics')
  }
  return response.json()
}

export default async function GrowthAnalyticsPage({
  searchParams,
}: {
  searchParams: { timeRange?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/analytics/growth')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const timeRange = searchParams.timeRange || 'last_30_days'
  const { metrics, charts } = await getGrowthAnalytics(timeRange)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Platform Growth</h1>
        <p className="text-gray-600 mt-1">User acquisition, retention, and churn analytics</p>
      </div>

      {/* Metrics */}
      <MetricCards
        metrics={{
          totalRevenue: 0,
          totalOrders: 0,
          newSignups: metrics.newSignups,
          productsListed: 0,
          activeSellers: 0,
          approvalRate: 0,
          platformRating: 0,
          supportTickets: 0,
        }}
      />

      {/* Charts */}
      <AdminCharts userGrowthData={charts.userGrowthOverTime} />
    </div>
  )
}
