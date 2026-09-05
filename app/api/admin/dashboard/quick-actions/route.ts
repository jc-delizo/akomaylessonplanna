import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getQuickActionsCounts } from '@/lib/utils/admin-quick-actions'

/**
 * GET /api/admin/dashboard/quick-actions
 * Get pending counts for quick action cards
 * Cache: 1 minute (per design)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const counts = await getQuickActionsCounts(supabase)
    return NextResponse.json(counts)
  } catch (error) {
    console.error('Error in GET /api/admin/dashboard/quick-actions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
