import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getDashboardMetricsData } from '@/lib/utils/admin-dashboard-metrics'

/**
 * GET /api/admin/dashboard
 * Get dashboard metrics for admin panel
 *
 * Query parameters:
 * - timeRange?: 'today' | 'yesterday' | 'this_week' | 'last_7_days' | 'this_month' | 'last_30_days' | 'this_year' | 'all_time' | 'custom'
 * - startDate?: ISO date string (for custom range)
 * - endDate?: ISO date string (for custom range)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || 'last_30_days'
    const startDate = searchParams.get('startDate') ?? undefined
    const endDate = searchParams.get('endDate') ?? undefined

    const result = await getDashboardMetricsData(supabase, timeRange, {
      startDate,
      endDate,
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/dashboard:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
