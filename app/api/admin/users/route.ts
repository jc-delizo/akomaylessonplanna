import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/users
 * List all users with search, filters, and pagination
 * 
 * Query parameters:
 * - search?: string (name, email, username, PRC license)
 * - role?: 'buyer' | 'seller' | 'admin'
 * - verification?: 'verified' | 'unverified' | 'pending'
 * - tier?: 'free' | 'pro' | 'pioneer'
 * - banned?: boolean
 * - signupDateFrom?: ISO date
 * - signupDateTo?: ISO date
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

    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const verification = searchParams.get('verification')
    const tier = searchParams.get('tier')
    const banned = searchParams.get('banned')
    const signupDateFrom = searchParams.get('signupDateFrom')
    const signupDateTo = searchParams.get('signupDateTo')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('users')
      .select(`
        id,
        email,
        name,
        username,
        avatar_url,
        role,
        is_verified_teacher,
        subscription_tier,
        is_banned,
        ban_reason,
        created_at,
        updated_at
      `, { count: 'exact' })

    // Search filter
    if (search) {
      query = query.or(
        `name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
      )
    }

    // Role filter
    if (role) {
      query = query.eq('role', role)
    }

    // Verification filter
    if (verification === 'verified') {
      query = query.eq('is_verified_teacher', true)
    } else if (verification === 'unverified') {
      query = query.eq('is_verified_teacher', false)
    } else if (verification === 'pending') {
      // Check if user has pending verification
      query = query.eq('is_verified_teacher', false)
    }

    // Tier filter
    if (tier) {
      query = query.eq('subscription_tier', tier)
    }

    // Banned filter
    if (banned !== null) {
      query = query.eq('is_banned', banned === 'true')
    }

    // Signup date filters
    if (signupDateFrom) {
      query = query.gte('created_at', signupDateFrom)
    }
    if (signupDateTo) {
      query = query.lte('created_at', signupDateTo)
    }

    // Pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: users, error, count } = await query
    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    // Get additional stats for each user
    const usersWithStats = await Promise.all(
      (users || []).map(async (user) => {
        // Get product count
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id)
          .eq('status', 'published')

        // Get sales count (as seller)
        const { count: salesCount } = await supabase
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', user.id)

        return {
          ...user,
          productCount: productCount || 0,
          salesCount: salesCount || 0,
        }
      })
    )

    return NextResponse.json({
      users: usersWithStats,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/users:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
