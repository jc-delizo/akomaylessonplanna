import type { SupabaseClient } from '@supabase/supabase-js'

export interface SupportTicketsParams {
  status?: string
  priority?: string
  category?: string
  assigned_to?: string
  page?: number
  limit?: number
}

/**
 * Get support tickets. Safe to call from server components or API routes.
 */
export async function getSupportTicketsData(
  supabase: SupabaseClient,
  params: SupportTicketsParams = {}
) {
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const offset = (page - 1) * limit

  let query = supabase
    .from('support_tickets')
    .select(
      `
      *,
      user:users!support_tickets_user_id_fkey(id, first_name, last_name, email, avatar_url),
      assigned_admin:users!support_tickets_assigned_to_fkey(id, first_name, last_name, email)
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.status) query = query.eq('status', params.status)
  if (params.priority) query = query.eq('priority', params.priority)
  if (params.category) query = query.eq('category', params.category)
  if (params.assigned_to) query = query.eq('assigned_to', params.assigned_to)

  const { data: tickets, error, count } = await query
  if (error) {
    console.error('Error fetching tickets:', error)
    throw new Error('Failed to fetch tickets')
  }
  return {
    tickets: tickets || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}
