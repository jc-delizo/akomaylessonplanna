import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { hasPermission } from '@/lib/utils/admin-permissions'
import { createNotification } from '@/lib/notifications/create-notification'

/**
 * POST /api/admin/users/[id]/warn
 * Send administrative warning to user (creates in-app notification)
 *
 * Body:
 * - reason: string (required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    if (!hasPermission(authResult.admin.adminRole, 'warn_user')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params
    const body = await request.json()
    const { reason } = body

    if (!reason || !String(reason).trim()) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    // Create admin_warning notification
    await createNotification({
      user_id: userId,
      type: 'admin_warning',
      title: 'Administrative Warning',
      message: reason.trim(),
    })

    // Log to audit
    await logAdminAction(
      authResult.admin.userId,
      'user_warned',
      'user',
      userId,
      { reason: reason.trim() },
      reason.trim()
    )

    return NextResponse.json({ success: true, message: 'User warned successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/warn:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
