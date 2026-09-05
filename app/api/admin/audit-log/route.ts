import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { getAuditLogData } from '@/lib/utils/admin-audit-log'
import { parseBoundedInteger } from '@/lib/utils/query-params'

/**
 * GET /api/admin/audit-log
 * Get audit trail (all admins can view own, Super Admin can view all)
 * 
 * Query parameters:
 * - admin_id?: string (filter by admin)
 * - action?: string (filter by action)
 * - entity_type?: string (filter by entity type)
 * - startDate?: ISO date
 * - endDate?: ISO date
 * - page?: number (default: 1)
 * - limit?: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const sp = request.nextUrl.searchParams
    const filterByAdminId =
      authResult.admin.adminRole !== 'super_admin' ? authResult.admin.userId : undefined
    const result = await getAuditLogData(
      supabase,
      {
        admin_id: sp.get('admin_id') || undefined,
        action: sp.get('action') || undefined,
        entity_type: sp.get('entity_type') || undefined,
        startDate: sp.get('startDate') || undefined,
        endDate: sp.get('endDate') || undefined,
        page: parseBoundedInteger(sp.get('page'), 1, 1, 10_000),
        limit: parseBoundedInteger(sp.get('limit'), 50, 1, 100),
      },
      { filterByAdminId }
    )
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/audit-log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
