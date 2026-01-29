import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getRevenueData } from '@/lib/utils/admin-financials-revenue'
import { Card } from '@/components/ui/card'
import { MetricCards } from '@/components/admin/dashboard/metric-cards'
import { AdminCharts } from '@/components/admin/dashboard/charts'

export default async function RevenuePage({
  searchParams,
}: {
  searchParams: Promise<{ timeRange?: string }> | { timeRange?: string }
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

  const params = searchParams instanceof Promise ? await searchParams : searchParams
  const timeRange = params.timeRange || 'last_30_days'
  const { metrics, charts } = await getRevenueData(supabase, timeRange)

  // Map revenue metrics to MetricCards shape (dashboard component expects all 8 fields)
  const metricCardsMetrics = {
    totalRevenue: metrics.totalRevenue,
    totalOrders: metrics.totalOrders,
    newSignups: 0,
    productsListed: 0,
    activeSellers: metrics.activeSellers,
    approvalRate: 0,
    platformRating: 0,
    supportTickets: metrics.pendingPayouts,
  }

  // Transform revenue chart data to AdminCharts expected shapes
  const revOverTime = charts.revenueOverTime as Array<{ created_at: string; total_commission?: number }>
  const byDateRev: Record<string, number> = {}
  const byDateOrders: Record<string, number> = {}
  for (const row of revOverTime) {
    const date = row.created_at?.slice(0, 10) ?? ''
    byDateRev[date] = (byDateRev[date] || 0) + Number(row.total_commission || 0)
    byDateOrders[date] = (byDateOrders[date] || 0) + 1
  }
  const userGrowthData = Object.entries(byDateOrders).map(([date, users]) => ({ date, users })).sort((a, b) => a.date.localeCompare(b.date))
  const orderVolumeData = Object.entries(byDateOrders).map(([date, orders]) => ({ date, orders })).sort((a, b) => a.date.localeCompare(b.date))

  const revByCat = charts.revenueByCategory as Array<{ product?: { product_type?: string }; price?: number }>
  const byCategory: Record<string, number> = {}
  for (const row of revByCat || []) {
    const cat = (row.product as any)?.product_type ?? 'Other'
    byCategory[cat] = (byCategory[cat] || 0) + Number(row.price || 0)
  }
  const salesByCategoryData = Object.entries(byCategory).map(([category, sales]) => ({ category, sales }))

  const topSellers = charts.topSellers as Array<{ price?: number; seller?: { first_name?: string; last_name?: string } }>
  const bySeller: Record<string, number> = {}
  for (const row of topSellers || []) {
    const seller = row.seller ? [row.seller.first_name, row.seller.last_name].filter(Boolean).join(' ') || 'Unknown' : 'Unknown'
    bySeller[seller] = (bySeller[seller] || 0) + Number(row.price || 0)
  }
  const sellerPerformanceData = Object.entries(bySeller)
    .map(([seller, revenue]) => ({ seller, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Revenue Overview</h1>
        <p className="text-gray-600 mt-1">Platform financial metrics and analytics</p>
      </div>

      {/* Metric Cards */}
      <MetricCards metrics={metricCardsMetrics} />

      {/* Charts */}
      <AdminCharts
        userGrowthData={userGrowthData}
        salesByCategoryData={salesByCategoryData}
        orderVolumeData={orderVolumeData}
        sellerPerformanceData={sellerPerformanceData}
      />
    </div>
  )
}
