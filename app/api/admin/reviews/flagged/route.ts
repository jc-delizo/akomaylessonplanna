import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

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
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const status = searchParams.get('status') || 'pending'
    const flagType = searchParams.get('flag_type')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query
    let query = supabase
      .from('review_flags')
      .select(`
        *,
        review:reviews!review_flags_review_id_fkey(
          *,
          buyer:users!reviews_buyer_id_fkey(
            id,
            name,
            email
          ),
          product:products!reviews_product_id_fkey(
            id,
            title,
            seller_id,
            seller:users!products_seller_id_fkey(
              id,
              name,
              username
            )
          )
        ),
        reporter:users!review_flags_reporter_id_fkey(
          id,
          name
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
