import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getDisputesData } from '@/lib/utils/admin-disputes'
import { parseBoundedInteger } from '@/lib/utils/query-params'

/**
 * GET /api/admin/disputes
 * Get dispute queue
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) return authResult.response

    const supabase = createAdminClient()
    const sp = request.nextUrl.searchParams
    const result = await getDisputesData(supabase, {
      status: sp.get('status') || 'open',
      severity: sp.get('severity') || undefined,
      type: sp.get('type') || undefined,
      page: parseBoundedInteger(sp.get('page'), 1, 1, 10_000),
      limit: parseBoundedInteger(sp.get('limit'), 50, 1, 100),
    })
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/disputes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
