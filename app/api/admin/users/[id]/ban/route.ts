import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { hasPermission, requiresApproval } from '@/lib/utils/admin-permissions'

/**
 * POST /api/admin/users/[id]/ban
 * Ban a user
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

    // Check permission
    if (!hasPermission(authResult.admin.adminRole, 'ban_user')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if approval required
    if (requiresApproval(authResult.admin.adminRole, 'ban_user')) {
      // TODO: Implement approval workflow
      return NextResponse.json(
        { error: 'This action requires Super Admin approval', requiresApproval: true },
        { status: 403 }
      )
    }

    const { id: userId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { reason } = body

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

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'user_banned',
      'user',
      userId,
      { is_banned: { from: false, to: true }, ban_reason: reason },
      reason
    )

    // TODO: Send email notification

    return NextResponse.json({ success: true, message: 'User banned successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/ban:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
