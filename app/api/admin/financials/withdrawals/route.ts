import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'
import { getWithdrawalsData } from '@/lib/utils/admin-withdrawals'

/**
 * GET /api/admin/financials/withdrawals
 * Get withdrawal requests (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) return authResult.response

    const supabase = await createClient()
    const sp = request.nextUrl.searchParams
    const result = await getWithdrawalsData(supabase, {
      status: sp.get('status') || 'pending',
      page: parseInt(sp.get('page') || '1', 10),
      limit: parseInt(sp.get('limit') || '50', 10),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/financials/withdrawals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
