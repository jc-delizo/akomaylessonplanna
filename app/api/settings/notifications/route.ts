import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/settings/notifications
 * Update email notification preference
 * Body: { email_notifications: boolean }
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { email_notifications } = body

    if (typeof email_notifications !== 'boolean') {
      return NextResponse.json(
        { error: 'email_notifications must be a boolean' },
        { status: 400 }
      )
    }

    // Update user's email notification preference
    const { data: updatedUser, error } = await createAdminClient()
      .from('users')
      .update({ email_notifications })
      .eq('id', user.id)
      .select('id, email_notifications')
      .single()

    if (error) {
      console.error('Error updating notification preference:', error)
      return NextResponse.json(
        { error: 'Failed to update notification preference' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      user: updatedUser,
      message: 'Notification preference updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/settings/notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
