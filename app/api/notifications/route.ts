import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { parseBoundedInteger } from '@/lib/utils/query-params'

/**
 * GET /api/notifications
 * Get current user's notifications (paginated)
 * Query params: ?filter=all|unread&page=1&limit=20
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get('filter') || 'all' // 'all' or 'unread'
    const page = parseBoundedInteger(searchParams.get('page'), 1, 1, 10_000)
    const limit = parseBoundedInteger(searchParams.get('limit'), 20, 1, 100)
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // Apply filter
    if (filter === 'unread') {
      query = query.eq('is_read', false)
    }

    // Apply pagination
    const { data: notifications, error, count } = await query
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching notifications:', error)
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      notifications: notifications || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
