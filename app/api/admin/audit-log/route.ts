import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

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

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const adminId = searchParams.get('admin_id')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entity_type')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('audit_log')
      .select(`
        *,
        admin:users!audit_log_admin_id_fkey(id, name, email)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Super Admin can view all, others can only view own
    if (authResult.admin.adminRole !== 'super_admin') {
      query = query.eq('admin_id', authResult.admin.userId)
    }

    if (adminId) {
      query = query.eq('admin_id', adminId)
    }

    if (action) {
      query = query.eq('action', action)
    }

    if (entityType) {
      query = query.eq('entity_type', entityType)
    }

    if (startDate) {
      query = query.gte('created_at', startDate)
    }

    if (endDate) {
      query = query.lte('created_at', endDate)
    }

    const { data: logs, error, count } = await query

    if (error) {
      console.error('Error fetching audit log:', error)
      return NextResponse.json({ error: 'Failed to fetch audit log' }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/audit-log:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
