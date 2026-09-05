import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { sendPioneerWelcomeEmail } from '@/lib/emails/pioneer-emails'

/**
 * POST /api/admin/pioneers/add
 * Add a seller as Pioneer (invite-only)
 * 
 * Body:
 * - user_id: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    // Only Super Admin can add Pioneers
    if (authResult.admin.adminRole !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only Super Admin can add Pioneers' },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { user_id } = body

    if (!user_id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // Check current Pioneer count (20-slot limit)
    const { count: currentPioneers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_pioneer', true)

    if ((currentPioneers || 0) >= 20) {
      return NextResponse.json(
        { error: 'Pioneer slots are full (20/20). Remove a Pioneer first.' },
        { status: 400 }
      )
    }

    // Check if user is already a Pioneer
    const { data: user } = await supabase
      .from('users')
      .select('is_pioneer, subscription_tier')
      .eq('id', user_id)
      .single()

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.is_pioneer) {
      return NextResponse.json({ error: 'User is already a Pioneer' }, { status: 400 })
    }

    // Update user to Pioneer
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        is_pioneer: true,
        subscription_tier: 'pioneer',
        custom_commission_rate: 15, // Standard Pioneer commission
      })
      .eq('id', user_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error adding Pioneer:', updateError)
      return NextResponse.json({ error: 'Failed to add Pioneer' }, { status: 500 })
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'pioneer_added',
      'user',
      user_id,
      {
        is_pioneer: { from: false, to: true },
        subscription_tier: { from: user.subscription_tier, to: 'pioneer' },
        commission_rate: { from: null, to: 15 },
      },
      'Pioneer added'
    )

    await sendPioneerWelcomeEmail(user_id)

    return NextResponse.json({
      success: true,
      pioneer: updatedUser,
      message: 'Pioneer added successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/admin/pioneers/add:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
