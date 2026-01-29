import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getGrowthAnalyticsData } from '@/lib/utils/admin-analytics-growth'

/**
 * GET /api/admin/analytics/growth
 * Get platform growth analytics (real-time)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }
    const supabase = await createClient()
    const timeRange = request.nextUrl.searchParams.get('timeRange') || 'last_30_days'
    const result = await getGrowthAnalyticsData(supabase, timeRange)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/growth:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
