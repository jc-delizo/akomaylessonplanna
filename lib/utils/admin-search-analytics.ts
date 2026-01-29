import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get search analytics. Safe to call from server components or API routes.
 */
export async function getSearchAnalyticsData(
  supabase: SupabaseClient,
  timeRange: string = 'last_30_days'
) {
  const now = new Date()
  let startDate: Date
  switch (timeRange) {
    case 'last_7_days':
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 7)
      break
    case 'last_30_days':
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
      break
    default:
      startDate = new Date(now)
      startDate.setDate(startDate.getDate() - 30)
  }

  const { data: searchQueries } = await supabase
    .from('search_queries')
    .select('*')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: false })

  const { data: searchAnalytics } = await supabase
    .from('search_analytics')
    .select('*')
    .gte('date', startDate.toISOString().split('T')[0])
    .order('date', { ascending: false })

  const totalSearches = searchQueries?.length || 0
  const uniqueTerms = new Set(searchQueries?.map((q: any) => q.query) || []).size
  const zeroResultsSearches = searchQueries?.filter((q: any) => q.result_count === 0) || []
  const zeroResultsCount = zeroResultsSearches.length
  const avgResults =
    searchQueries && searchQueries.length > 0
      ? searchQueries.reduce((sum: number, q: any) => sum + (q.result_count || 0), 0) /
        searchQueries.length
      : 0
  const searchesWithFilters =
    searchQueries?.filter((q: any) => q.filters && Object.keys(q.filters).length > 0).length || 0
  const totalClicks = searchAnalytics?.reduce((sum, a: any) => sum + (a.clicks || 0), 0) || 0
  const totalImpressions =
    searchAnalytics?.reduce((sum, a: any) => sum + (a.impressions || 0), 0) || 0
  const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

  const termCounts: Record<string, number> = {}
  searchQueries?.forEach((q: any) => {
    termCounts[q.query] = (termCounts[q.query] || 0) + 1
  })
  const topSearchTerms = Object.entries(termCounts)
    .map(([term, count]) => ({ term, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20)

  const categoryCounts: Record<string, number> = {}
  searchQueries?.forEach((q: any) => {
    if (q.category) {
      categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1
    }
  })

  return {
    metrics: {
      totalSearches,
      uniqueTerms,
      zeroResultsSearches: zeroResultsCount,
      avgSearchResults: Math.round(avgResults * 10) / 10,
      searchesWithFilters,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10,
    },
    topSearchTerms,
    searchesByCategory: categoryCounts,
    searchVolumeOverTime: searchQueries || [],
    zeroResultsReport: zeroResultsSearches.slice(0, 20),
  }
}
