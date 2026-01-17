import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { MetricCard } from '@/components/admin/dashboard/metric-cards'
import { Search, TrendingUp, AlertTriangle } from 'lucide-react'

async function getSearchAnalytics() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/search/analytics`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch search analytics')
  }
  return response.json()
}

export default async function SearchAnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/search/analytics')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const { metrics, topSearchTerms, zeroResultsReport } = await getSearchAnalytics()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Search Analytics</h1>
        <p className="text-gray-600 mt-1">Monitor search behavior and identify content gaps</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="Total Searches"
          value={metrics.totalSearches.toLocaleString()}
          icon={<Search className="h-5 w-5" />}
        />
        <MetricCard
          title="Unique Terms"
          value={metrics.uniqueTerms.toLocaleString()}
          icon={<TrendingUp className="h-5 w-5" />}
        />
        <MetricCard
          title="Zero Results"
          value={metrics.zeroResultsSearches.toLocaleString()}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <MetricCard
          title="Avg Results"
          value={metrics.avgSearchResults.toFixed(1)}
        />
        <MetricCard
          title="With Filters"
          value={metrics.searchesWithFilters.toLocaleString()}
        />
        <MetricCard
          title="Click-Through Rate"
          value={`${metrics.clickThroughRate.toFixed(1)}%`}
        />
      </div>

      {/* Top Search Terms */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Top Search Terms</h3>
        <div className="space-y-2">
          {topSearchTerms?.slice(0, 20).map((term: any, index: number) => (
            <div key={term.term} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-500 w-8">#{index + 1}</span>
                <span className="font-medium">{term.term}</span>
              </div>
              <span className="text-sm text-gray-600">{term.count} searches</span>
            </div>
          ))}
        </div>
      </Card>

      {/* Zero Results Report */}
      {zeroResultsReport && zeroResultsReport.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Zero Results Searches</h3>
          <p className="text-sm text-gray-600 mb-4">
            These searches returned no results. Consider creating products for these terms.
          </p>
          <div className="space-y-2">
            {zeroResultsReport.slice(0, 20).map((search: any) => (
              <div
                key={search.id}
                className="flex items-center justify-between p-2 hover:bg-gray-50 rounded"
              >
                <div>
                  <p className="font-medium">{search.query}</p>
                  <p className="text-xs text-gray-500">
                    {search.result_count || 0} results • Last searched:{' '}
                    {new Date(search.created_at).toLocaleDateString()}
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Track Term
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
