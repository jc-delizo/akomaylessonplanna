import type { SupabaseClient } from '@supabase/supabase-js'

export interface DisputesParams {
  status?: string
  severity?: string
  type?: string
  page?: number
  limit?: number
}

/**
 * Get disputes list. Safe to call from server components or API routes.
 */
export async function getDisputesData(
  supabase: SupabaseClient,
  params: DisputesParams = {}
) {
  const status = params.status || 'open'
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const offset = (page - 1) * limit

  let query = supabase
    .from('disputes')
    .select(
      `
      *,
      buyer:users!disputes_buyer_id_fkey(id, first_name, last_name, email, avatar_url),
      seller:users!disputes_seller_id_fkey(id, first_name, last_name, email, avatar_url),
      product:products!disputes_product_id_fkey(id, title),
      order:orders!disputes_order_id_fkey(id, total_amount)
    `,
      { count: 'exact' }
    )
    .eq('status', status)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (params.severity) query = query.eq('severity', params.severity)
  if (params.type) query = query.eq('type', params.type)

  const { data: disputes, error, count } = await query
  if (error) {
    console.error('Error fetching disputes:', error)
    throw new Error('Failed to fetch disputes')
  }
  return {
    disputes: disputes || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}
