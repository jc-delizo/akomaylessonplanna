import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { MetricCards } from '@/components/admin/dashboard/metric-cards'
import { AdminCharts } from '@/components/admin/dashboard/charts'

async function getRevenueData(timeRange: string = 'last_30_days') {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/financials/revenue?timeRange=${timeRange}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch revenue data')
  }
  return response.json()
}

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: { timeRange?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/financials/revenue')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser || adminUser.admin_role !== 'super_admin') {
    redirect('/admin')
  }

  const timeRange = searchParams.timeRange || 'last_30_days'
  const { metrics, charts } = await getRevenueData(timeRange)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenue Overview</h1>
        <p className="text-gray-600 mt-1">Platform financial metrics and analytics</p>
      </div>

      {/* Metric Cards */}
      <MetricCards metrics={metrics} />

      {/* Charts */}
      <AdminCharts
        userGrowthData={charts.revenueOverTime}
        salesByCategoryData={charts.revenueByCategory}
        orderVolumeData={charts.revenueOverTime}
        sellerPerformanceData={charts.topSellers}
      />
    </div>
  )
}
