import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createSystemAnnouncement } from '@/lib/notifications/notification-triggers'
import { getAnnouncementsData } from '@/lib/utils/admin-announcements'

/**
 * POST /api/admin/announcements
 * Create system announcement
 * Body: { title, message, target_audience, delivery_type, scheduled_for }
 * Auth required (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { title, message, target_audience, action_url } = body

    if (!title || !message) {
      return NextResponse.json(
        { error: 'Title and message are required' },
        { status: 400 }
      )
    }

    // Create system announcement
    const count = await createSystemAnnouncement(
      title,
      message,
      action_url,
      target_audience || 'all'
    )

    return NextResponse.json({
      success: true,
      message: `Announcement sent to ${count} users`,
      count,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/announcements
 * List all announcements (sent and scheduled)
 * Auth required (admin only)
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

    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userData?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required' },
        { status: 403 }
      )
    }

    const result = await getAnnouncementsData(supabase)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
