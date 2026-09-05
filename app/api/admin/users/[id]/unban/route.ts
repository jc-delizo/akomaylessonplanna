import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { hasPermission } from '@/lib/utils/admin-permissions'

/**
 * POST /api/admin/users/[id]/unban
 * Unban a user
 * 
 * Body:
 * - reason?: string (optional, for audit log)
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

    // Check permission (only Super Admin can unban)
    if (!hasPermission(authResult.admin.adminRole, 'ban_user')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: userId } = await params
    const supabase = createAdminClient()
    const body = await request.json().catch(() => ({}))
    const reason = body?.reason

    // Get current ban reason for audit log
    const { data: currentUser } = await supabase
      .from('users')
      .select('role, is_banned, ban_reason')
      .eq('id', userId)
      .single()

    if (!currentUser || !currentUser.is_banned) {
      return NextResponse.json({ error: 'User is not banned' }, { status: 400 })
    }

    if (currentUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Administrator accounts cannot be unbanned through this endpoint' },
        { status: 403 }
      )
    }

    // Update user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        is_banned: false,
        ban_reason: null,
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error unbanning user:', updateError)
      return NextResponse.json({ error: 'Failed to unban user' }, { status: 500 })
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'user_unbanned',
      'user',
      userId,
      {
        is_banned: { from: true, to: false },
        ban_reason: { from: currentUser.ban_reason, to: null },
      },
      reason || 'User unbanned'
    )

    // TODO: Send email notification

    return NextResponse.json({ success: true, message: 'User unbanned successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/unban:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
