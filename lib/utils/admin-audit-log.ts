import type { SupabaseClient } from '@supabase/supabase-js'

export interface AuditLogParams {
  admin_id?: string
  action?: string
  entity_type?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
}

/**
 * Get audit log. Safe to call from server components or API routes.
 * Pass filterByAdminId when non-super_admin so only own logs are returned.
 */
export async function getAuditLogData(
  supabase: SupabaseClient,
  params: AuditLogParams = {},
  options?: { filterByAdminId?: string }
) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const offset = (page - 1) * limit

  let query = supabase
    .from('audit_log')
    .select(
      `*,
      admin:users!audit_log_admin_id_fkey(id, first_name, last_name, email)`,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (options?.filterByAdminId) query = query.eq('admin_id', options.filterByAdminId)
  if (params.admin_id) query = query.eq('admin_id', params.admin_id)
  if (params.action) query = query.eq('action', params.action)
  if (params.entity_type) query = query.eq('entity_type', params.entity_type)
  if (params.startDate) query = query.gte('created_at', params.startDate)
  if (params.endDate) query = query.lte('created_at', params.endDate)

  const { data: logs, error, count } = await query
  if (error) {
    console.error('Error fetching audit log:', error)
    throw new Error('Failed to fetch audit log')
  }
  return {
    logs: logs || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}
