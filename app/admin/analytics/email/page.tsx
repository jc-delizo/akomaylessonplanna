import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { EmailAnalyticsClient } from '@/components/admin/email/analytics-dashboard-client'

async function getEmailAnalytics(startDate?: string, endDate?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const params = new URLSearchParams()
  if (startDate) params.set('start_date', startDate)
  if (endDate) params.set('end_date', endDate)

  const response = await fetch(`${baseUrl}/api/admin/email/analytics?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch email analytics')
  }
  return response.json()
}

async function getAnalyticsByType(startDate?: string, endDate?: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const params = new URLSearchParams()
  if (startDate) params.set('start_date', startDate)
  if (endDate) params.set('end_date', endDate)

  const response = await fetch(`${baseUrl}/api/admin/email/analytics/by-type?${params.toString()}`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    return { by_type: [] }
  }
  return response.json()
}

export default async function EmailAnalyticsPage({
  searchParams,
}: {
  searchParams: { start_date?: string; end_date?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/analytics/email')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/admin')
  }

  const analytics = await getEmailAnalytics(
    searchParams.start_date,
    searchParams.end_date
  )
  const byType = await getAnalyticsByType(
    searchParams.start_date,
    searchParams.end_date
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Email Analytics</h1>
        <p className="text-gray-600 mt-1">
          Monitor email delivery, engagement, and performance
        </p>
      </div>

      <EmailAnalyticsClient
        initialMetrics={analytics.metrics}
        initialQueue={analytics.queue}
        initialByType={byType.by_type || []}
        dateRange={analytics.date_range}
      />
    </div>
  )
}
