import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { hasPermission } from '@/lib/utils/admin-permissions'

/**
 * POST /api/admin/users/[id]/ban
 * Ban a user
 * 
 * Body:
 * - reason: string (required)
 * - report_id?: string (optional, for audit when banning from report)
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

    // Check permission
    if (!hasPermission(authResult.admin.adminRole, 'ban_user')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { reason, report_id } = body

    if (!reason) {
      return NextResponse.json({ error: 'Ban reason is required' }, { status: 400 })
    }

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_banned: true,
        ban_reason: reason,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error banning user:', updateError)
      return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 })
    }

    // Log action (include report_id when banning from report)
    const changes: Record<string, unknown> = {
      is_banned: { from: false, to: true },
      ban_reason: reason,
    }
    if (report_id) {
      changes.report_id = report_id
    }
    await logAdminAction(
      authResult.admin.userId,
      'user_banned',
      'user',
      userId,
      changes,
      reason
    )

    // TODO: Send email notification

    return NextResponse.json({ success: true, message: 'User banned successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/ban:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
