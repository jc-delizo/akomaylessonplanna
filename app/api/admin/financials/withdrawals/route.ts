import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { getWithdrawalsData } from '@/lib/utils/admin-withdrawals'
import { parseBoundedInteger } from '@/lib/utils/query-params'

/**
 * GET /api/admin/financials/withdrawals
 * Get withdrawal requests (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) return authResult.response

    const supabase = createAdminClient()
    const sp = request.nextUrl.searchParams
    const result = await getWithdrawalsData(supabase, {
      status: sp.get('status') || 'pending',
      page: parseBoundedInteger(sp.get('page'), 1, 1, 10_000),
      limit: parseBoundedInteger(sp.get('limit'), 50, 1, 100),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/financials/withdrawals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
