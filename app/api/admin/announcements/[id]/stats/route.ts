import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/admin/announcements/[id]/stats
 * Get announcement statistics (open rate, click rate)
 * Auth required (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Get announcement
    const { data: announcement, error: announcementError } = await supabase
      .from('notifications')
      .select('id, type, title, created_at')
      .eq('id', id)
      .eq('type', 'system_announcement')
      .single()

    if (announcementError || !announcement) {
      return NextResponse.json(
        { error: 'Announcement not found' },
        { status: 404 }
      )
    }

    // Get all notifications for this announcement (same title and created_at within 1 minute)
    const announcementTime = new Date(announcement.created_at)
    const oneMinuteLater = new Date(announcementTime.getTime() + 60000)

    const { data: allNotifications, error: notificationsError } = await supabase
      .from('notifications')
      .select('id, is_read, action_url')
      .eq('type', 'system_announcement')
      .eq('title', announcement.title)
      .gte('created_at', announcementTime.toISOString())
      .lte('created_at', oneMinuteLater.toISOString())

    if (notificationsError) {
      console.error('Error fetching notification stats:', notificationsError)
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      )
    }

    const total = allNotifications?.length || 0
    const read = allNotifications?.filter((n) => n.is_read).length || 0
    const clicked = allNotifications?.filter(
      (n) => n.is_read && n.action_url
    ).length || 0

    const openRate = total > 0 ? (read / total) * 100 : 0
    const clickRate = total > 0 ? (clicked / total) * 100 : 0

    return NextResponse.json({
      announcement: {
        id: announcement.id,
        title: announcement.title,
        created_at: announcement.created_at,
      },
      stats: {
        total,
        read,
        clicked,
        openRate: Math.round(openRate * 100) / 100,
        clickRate: Math.round(clickRate * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/announcements/[id]/stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
