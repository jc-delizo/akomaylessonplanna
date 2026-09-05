import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, requirePermission } from '@/lib/middleware/admin-auth'
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
    const authResult = await requirePermission(request, 'create_announcements')
    if (!authResult.success) {
      return authResult.response
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
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const result = await getAnnouncementsData(createAdminClient())
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/announcements:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
