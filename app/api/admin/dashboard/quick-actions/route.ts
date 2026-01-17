import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

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

    const supabase = await createClient()

    // Helper to safely get count, return 0 if table doesn't exist
    const getCount = async (table: string, filter?: any) => {
      try {
        let query = supabase.from(table).select('*', { count: 'exact', head: true })
        if (filter) {
          Object.entries(filter).forEach(([key, value]) => {
            query = query.eq(key, value)
          })
        }
        const { count, error } = await query
        if (error) {
          // Table might not exist - return 0
          if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            return 0
          }
          throw error
        }
        return count || 0
      } catch (error) {
        // If table doesn't exist or other error, return 0
        return 0
      }
    }

    // Get counts with error handling for missing tables
    const [pendingProducts, verificationQueue, flaggedReviews, withdrawalRequests] = await Promise.all([
      getCount('products', { status: 'pending_review' }),
      getCount('teacher_id_verifications', { status: 'pending' }),
      getCount('review_flags', { status: 'pending' }),
      getCount('withdrawal_requests', { status: 'pending' }),
    ])

    return NextResponse.json({
      pendingProducts,
      verificationQueue,
      flaggedReviews,
      withdrawalRequests,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/dashboard/quick-actions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
