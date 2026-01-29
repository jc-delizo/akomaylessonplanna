import type { SupabaseClient } from '@supabase/supabase-js'

export interface WithdrawalsParams {
  status?: string
  page?: number
  limit?: number
}

/**
 * Get withdrawal requests. Safe to call from server components or API routes.
 */
export async function getWithdrawalsData(
  supabase: SupabaseClient,
  params: WithdrawalsParams = {}
) {
  const status = params.status || 'pending'
  const page = params.page ?? 1
  const limit = params.limit ?? 50
  const offset = (page - 1) * limit

  let query = supabase
    .from('withdrawal_requests')
    .select(
      `
      *,
      seller:users!withdrawal_requests_seller_id_fkey(
        id,
        first_name,
        last_name,
        email,
        username,
        avatar_url
      )
    `,
      { count: 'exact' }
    )
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status !== 'all') {
    query = query.eq('status', status)
  }

  const { data: withdrawals, error, count } = await query
  if (error) {
    console.error('Error fetching withdrawals:', error)
    throw new Error('Failed to fetch withdrawals')
  }
  return {
    withdrawals: withdrawals || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}
