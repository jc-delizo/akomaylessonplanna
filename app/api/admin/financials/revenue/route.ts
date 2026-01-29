import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { getRevenueData } from '@/lib/utils/admin-financials-revenue'

/**
 * GET /api/admin/financials/revenue
 * Get revenue overview with charts (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) return authResult.response

    const supabase = await createClient()
    const timeRange = request.nextUrl.searchParams.get('timeRange') || 'last_30_days'
    const result = await getRevenueData(supabase, timeRange)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/financials/revenue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
