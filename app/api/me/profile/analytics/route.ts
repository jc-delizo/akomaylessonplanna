import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/me/profile/analytics
 * Get profile analytics for current user
 * 
 * Requires authentication
 * Returns:
 * - Profile views (total, daily/weekly graph)
 * - Traffic sources
 * - Most viewed products (top 10)
 * - Conversion rate
 * 
 * Query parameters:
 * - range: today | week | month | all (default: month)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Check authentication
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const range = searchParams.get('range') || 'month'

    // Calculate date range
    let startDate: Date
    const endDate = new Date()

    switch (range) {
      case 'today':
        startDate = new Date()
        startDate.setHours(0, 0, 0, 0)
        break
      case 'week':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
      default:
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
    }

    // Get total profile views
    const { count: totalViews, error: viewsError } = await supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('profile_user_id', authUser.id)
      .gte('viewed_at', startDate.toISOString())

    if (viewsError) {
      console.error('Error fetching profile views:', viewsError)
    }

    // Get daily views for graph (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: dailyViews, error: dailyViewsError } = await supabase
      .from('profile_views')
      .select('viewed_at')
      .eq('profile_user_id', authUser.id)
      .gte('viewed_at', thirtyDaysAgo.toISOString())
      .order('viewed_at', { ascending: true })

    if (dailyViewsError) {
      console.error('Error fetching daily views:', dailyViewsError)
    }

    // Aggregate daily views
    const dailyViewsMap = new Map<string, number>()
    dailyViews?.forEach((view) => {
      const date = new Date(view.viewed_at).toISOString().split('T')[0]
      dailyViewsMap.set(date, (dailyViewsMap.get(date) || 0) + 1)
    })

    const dailyViewsData = Array.from(dailyViewsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    // Get unique views (by viewer_id)
    const { count: uniqueViews, error: uniqueViewsError } = await supabase
      .from('profile_views')
      .select('viewer_id', { count: 'exact', head: true })
      .eq('profile_user_id', authUser.id)
      .gte('viewed_at', startDate.toISOString())
      .not('viewer_id', 'is', null)

    if (uniqueViewsError) {
      console.error('Error fetching unique views:', uniqueViewsError)
    }

    // Get anonymous views
    const { count: anonymousViews, error: anonymousViewsError } = await supabase
      .from('profile_views')
      .select('*', { count: 'exact', head: true })
      .eq('profile_user_id', authUser.id)
      .gte('viewed_at', startDate.toISOString())
      .is('viewer_id', null)

    if (anonymousViewsError) {
      console.error('Error fetching anonymous views:', anonymousViewsError)
    }

    // For now, return placeholder data since products don't exist yet
    // Once Feature 03 is implemented, we'll add:
    // - Most viewed products
    // - Conversion rate (profile views → sales)

    return NextResponse.json({
      analytics: {
        total_views: totalViews || 0,
        unique_views: uniqueViews || 0,
        anonymous_views: anonymousViews || 0,
        daily_views: dailyViewsData,
        range,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        // Placeholder data (will be implemented when products exist)
        most_viewed_products: [],
        conversion_rate: null,
        traffic_sources: {
          direct: anonymousViews || 0,
          authenticated: uniqueViews || 0,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching profile analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
