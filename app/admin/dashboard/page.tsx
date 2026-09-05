import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getQuickActionsCounts } from '@/lib/utils/admin-quick-actions'
import { getDashboardMetricsData } from '@/lib/utils/admin-dashboard-metrics'
import { MetricCards } from '@/components/admin/dashboard/metric-cards'
import { QuickActions } from '@/components/admin/dashboard/quick-actions'
import { AdminCharts } from '@/components/admin/dashboard/charts'
import { ActivityFeed } from '@/components/admin/dashboard/activity-feed'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RefreshCw } from 'lucide-react'
import { getFullName } from '@/lib/utils/profile'

async function getRecentActivity() {
  const supabase = createAdminClient()
  
  // Get recent audit log entries (last 20)
  const { data: auditLogs } = await supabase
    .from('audit_log')
    .select(`
      *,
      admin:users!audit_log_admin_id_fkey(id, first_name, last_name)
    `)
    .order('created_at', { ascending: false })
    .limit(20)

  // Transform to activity feed format
  const activities = (auditLogs || []).map((log) => {
    let type: 'approval' | 'issue' | 'sale' | 'other' = 'other'
    if (log.action.includes('approve')) type = 'approval'
    else if (log.action.includes('ban') || log.action.includes('suspend') || log.action.includes('flag')) type = 'issue'
    else if (log.action.includes('order') || log.action.includes('sale')) type = 'sale'

    return {
      id: log.id,
      type,
      action: log.action.replace(/_/g, ' '),
      target: `${log.entity_type} #${log.entity_id.substring(0, 8)}`,
      admin: log.admin ? getFullName(log.admin as any) : 'System',
      timestamp: log.created_at,
    }
  })

  return activities
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ timeRange?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/dashboard')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  // Await searchParams (Next.js 15+ requirement)
  const params = await searchParams
  const timeRange = params.timeRange || 'last_30_days'

  // Fetch data in same server context — no self-fetch, avoids prod failures
  const [metrics, quickActions, activities] = await Promise.all([
    getDashboardMetricsData(createAdminClient(), timeRange),
    getQuickActionsCounts(createAdminClient()),
    getRecentActivity(),
  ])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 mt-1">Platform overview and quick actions</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <select
            defaultValue={timeRange}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this_week">This Week</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="this_month">This Month</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="this_year">This Year</option>
            <option value="all_time">All Time</option>
          </select>
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Action Cards */}
      <QuickActions
        pendingProducts={quickActions.pendingProducts}
        verificationQueue={quickActions.verificationQueue}
        flaggedReviews={quickActions.flaggedReviews}
        withdrawalRequests={quickActions.withdrawalRequests}
      />

      {/* Metric Cards */}
      <MetricCards metrics={metrics.metrics} />

      {/* Charts */}
      <AdminCharts />

      {/* Activity Feed */}
      <ActivityFeed activities={activities} />
    </div>
  )
}
