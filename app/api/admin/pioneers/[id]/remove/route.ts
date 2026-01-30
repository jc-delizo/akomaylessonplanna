import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { sendPioneerRemovedEmail } from '@/lib/emails/pioneer-emails'

/**
 * DELETE /api/admin/pioneers/[id]/remove
 * Remove Pioneer status from a seller
 * 
 * Body:
 * - reason: string (required)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    // Only Super Admin can remove Pioneers
    if (authResult.admin.adminRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only Super Admin can remove Pioneers' },
        { status: 403 }
      )
    }

    const { id: userId } = await params
    const supabase = await createClient()
    const body = await request.json()
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 })
    }

    // Get current user
    const { data: user } = await supabase
      .from('users')
      .select('is_pioneer, subscription_tier')
      .eq('id', userId)
      .single()

    if (!user || !user.is_pioneer) {
      return NextResponse.json({ error: 'User is not a Pioneer' }, { status: 400 })
    }

    // Update user (remove Pioneer status, revert to previous tier or 'free')
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        is_pioneer: false,
        subscription_tier: user.subscription_tier === 'pioneer' ? 'free' : user.subscription_tier,
        custom_commission_rate: null, // Revert to standard 20%
      })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error removing Pioneer:', updateError)
      return NextResponse.json({ error: 'Failed to remove Pioneer' }, { status: 500 })
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'pioneer_removed',
      'user',
      userId,
      {
        is_pioneer: { from: true, to: false },
        subscription_tier: { from: 'pioneer', to: updatedUser.subscription_tier },
        commission_rate: { from: 15, to: null },
      },
      reason.trim()
    )

    await sendPioneerRemovedEmail(userId, reason.trim())

    return NextResponse.json({
      success: true,
      message: 'Pioneer status removed',
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/pioneers/[id]/remove:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
