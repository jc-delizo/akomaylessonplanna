import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/financials/withdrawals
 * Get withdrawal requests (Super Admin only)
 * 
 * Query parameters:
 * - status?: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected'
 * - page?: number (default: 1)
 * - limit?: number (default: 50)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('withdrawal_requests')
      .select(`
        *,
        seller:users!withdrawal_requests_seller_id_fkey(
          id,
          name,
          email,
          username,
          avatar_url
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: withdrawals, error, count } = await query

    if (error) {
      console.error('Error fetching withdrawals:', error)
      return NextResponse.json({ error: 'Failed to fetch withdrawals' }, { status: 500 })
    }

    return NextResponse.json({
      withdrawals: withdrawals || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/financials/withdrawals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
