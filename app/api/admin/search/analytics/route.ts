import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/search/analytics
 * Get search analytics dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || 'last_30_days'

    // Calculate date range
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

    // Get search queries
    const { data: searchQueries } = await supabase
      .from('search_queries')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    // Get search analytics
    const { data: searchAnalytics } = await supabase
      .from('search_analytics')
      .select('*')
      .gte('date', startDate.toISOString().split('T')[0])
      .order('date', { ascending: false })

    // Calculate metrics
    const totalSearches = searchQueries?.length || 0
    const uniqueTerms = new Set(searchQueries?.map((q: any) => q.query) || []).size

    // Zero results searches
    const zeroResultsSearches = searchQueries?.filter((q: any) => q.result_count === 0) || []
    const zeroResultsCount = zeroResultsSearches.length

    // Average search results
    const avgResults =
      searchQueries && searchQueries.length > 0
        ? searchQueries.reduce((sum: number, q: any) => sum + (q.result_count || 0), 0) /
          searchQueries.length
        : 0

    // Searches with filters
    const searchesWithFilters =
      searchQueries?.filter((q: any) => q.filters && Object.keys(q.filters).length > 0).length || 0

    // Click-through rate (from search_analytics)
    const totalClicks = searchAnalytics?.reduce((sum, a: any) => sum + (a.clicks || 0), 0) || 0
    const totalImpressions = searchAnalytics?.reduce((sum, a: any) => sum + (a.impressions || 0), 0) || 0
    const clickThroughRate = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0

    // Top search terms
    const termCounts: Record<string, number> = {}
    searchQueries?.forEach((q: any) => {
      termCounts[q.query] = (termCounts[q.query] || 0) + 1
    })

    const topSearchTerms = Object.entries(termCounts)
      .map(([term, count]) => ({ term, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)

    // Searches by category
    const categoryCounts: Record<string, number> = {}
    searchQueries?.forEach((q: any) => {
      if (q.category) {
        categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1
      }
    })

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Error in GET /api/admin/search/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
