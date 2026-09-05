import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getGrowthAnalyticsData } from '@/lib/utils/admin-analytics-growth'
import { Card } from '@/components/ui/card'
import { MetricCards } from '@/components/admin/dashboard/metric-cards'
import { AdminCharts } from '@/components/admin/dashboard/charts'

export default async function GrowthAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ timeRange?: string }> | { timeRange?: string }
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

  const params = searchParams instanceof Promise ? await searchParams : searchParams
  const timeRange = params.timeRange || 'last_30_days'
  const { metrics, charts } = await getGrowthAnalyticsData(createAdminClient(), timeRange)

  // Aggregate userGrowthOverTime (created_at[]) into { date, users }[] for AdminCharts
  const byDate: Record<string, number> = {}
  for (const row of charts.userGrowthOverTime) {
    const date = row.created_at.slice(0, 10)
    byDate[date] = (byDate[date] || 0) + 1
  }
  const userGrowthData = Object.entries(byDate)
    .map(([date, users]) => ({ date, users }))
    .sort((a, b) => a.date.localeCompare(b.date))

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
      <AdminCharts userGrowthData={userGrowthData} />
    </div>
  )
}
