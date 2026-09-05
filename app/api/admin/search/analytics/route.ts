import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getSearchAnalyticsData } from '@/lib/utils/admin-search-analytics'

/**
 * GET /api/admin/search/analytics
 * Get search analytics dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) return authResult.response

    const supabase = createAdminClient()
    const timeRange = request.nextUrl.searchParams.get('timeRange') || 'last_30_days'
    const result = await getSearchAnalyticsData(supabase, timeRange)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/search/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
