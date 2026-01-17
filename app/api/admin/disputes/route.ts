import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/disputes
 * Get dispute queue
 * 
 * Query parameters:
 * - status?: 'open' | 'mediation' | 'resolved' | 'closed'
 * - severity?: 'high' | 'medium' | 'low'
 * - type?: 'quality' | 'payment' | 'copyright' | 'harassment'
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

    const status = searchParams.get('status') || 'open'
    const severity = searchParams.get('severity')
    const type = searchParams.get('type')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('disputes')
      .select(`
        *,
        buyer:users!disputes_buyer_id_fkey(id, name, email, avatar_url),
        seller:users!disputes_seller_id_fkey(id, name, email, avatar_url),
        product:products!disputes_product_id_fkey(id, title),
        order:orders!disputes_order_id_fkey(id, total_amount)
      `, { count: 'exact' })
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (severity) {
      query = query.eq('severity', severity)
    }

    if (type) {
      query = query.eq('type', type)
    }

    const { data: disputes, error, count } = await query

    if (error) {
      console.error('Error fetching disputes:', error)
      return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 })
    }

    return NextResponse.json({
      disputes: disputes || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/disputes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
