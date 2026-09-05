import { createAdminClient } from '@/lib/supabase/admin'
import { requirePermission } from '@/lib/middleware/admin-auth'
import { NextRequest, NextResponse } from 'next/server'
import { parseBoundedInteger } from '@/lib/utils/query-params'

/**
 * GET /api/admin/reviews/flagged
 * Get flagged reviews for moderation (admin only)
 * 
 * Query parameters:
 * - status?: 'pending' | 'approved' | 'dismissed' (default: 'pending')
 * - flag_type?: string (filter by flag type)
 * - limit: number (default: 50)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    const authResult = await requirePermission(request, 'view_flagged_reviews')
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()

    // Parse query parameters
    const status = searchParams.get('status') || 'pending'
    const flagType = searchParams.get('flag_type')
    const limit = parseBoundedInteger(searchParams.get('limit'), 50, 1, 100)
    const offset = parseBoundedInteger(searchParams.get('offset'), 0, 0, 1_000_000)

    // Build query
    let query = supabase
      .from('review_flags')
      .select(`
        *,
        review:reviews!review_flags_review_id_fkey(
          *,
          buyer:users!reviews_buyer_id_fkey(
            id,
            first_name,
            last_name,
            email
          ),
          product:products!reviews_product_id_fkey(
            id,
            title,
            seller_id,
            seller:users!products_seller_id_fkey(
              id,
              first_name,
              last_name,
              username
            )
          )
        ),
        reporter:users!review_flags_reporter_id_fkey(
          id,
          first_name,
          last_name
        )
      `, { count: 'exact' })
      .eq('status', status)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    if (flagType) {
      query = query.eq('flag_type', flagType)
    }

    const { data: flags, error, count } = await query

    if (error) {
      console.error('Error fetching flagged reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch flagged reviews' }, { status: 500 })
    }

    return NextResponse.json({
      flags: flags || [],
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/reviews/flagged:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
