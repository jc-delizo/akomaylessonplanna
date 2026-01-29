import type { SupabaseClient } from '@supabase/supabase-js'

export interface QuickActionsCounts {
  pendingProducts: number
  verificationQueue: number
  flaggedReviews: number
  withdrawalRequests: number
}

/**
 * Get pending counts for admin dashboard quick action cards.
 * Safe to call from server components or API routes; returns 0 for missing tables.
 */
export async function getQuickActionsCounts(
  supabase: SupabaseClient
): Promise<QuickActionsCounts> {
  const getCount = async (table: string, filter?: Record<string, unknown>) => {
    try {
      let query = supabase.from(table).select('*', { count: 'exact', head: true })
      if (filter) {
        for (const [key, value] of Object.entries(filter)) {
          query = query.eq(key, value)
        }
      }
      const { count, error } = await query
      if (error) {
        if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
          return 0
        }
        throw error
      }
      return count ?? 0
    } catch {
      return 0
    }
  }

  const [pendingProducts, verificationQueue, flaggedReviews, withdrawalRequests] =
    await Promise.all([
      getCount('products', { status: 'pending_review' }),
      getCount('teacher_id_verifications', { status: 'pending' }),
      getCount('review_flags', { status: 'pending' }),
      getCount('withdrawal_requests', { status: 'pending' }),
    ])

  return {
    pendingProducts,
    verificationQueue,
    flaggedReviews,
    withdrawalRequests,
  }
}
