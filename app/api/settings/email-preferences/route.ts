import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { initializeUserEmailPreferences } from '@/lib/emails/preference-checker'

/**
 * GET /api/settings/email-preferences
 * Get current user's email preferences
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

    const adminSupabase = createAdminClient()
    const preferences = await getUserEmailPreferences(user.id)

    return NextResponse.json({ preferences })
  } catch (error) {
    console.error('Error in GET /api/settings/email-preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/settings/email-preferences
 * Update email preferences
 * Body: { selling_notifications, buying_notifications, social_notifications, announcements }
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
    const {
      selling_notifications,
      buying_notifications,
      social_notifications,
      announcements,
    } = body

    // Validate all are booleans
    if (
      typeof selling_notifications !== 'boolean' ||
      typeof buying_notifications !== 'boolean' ||
      typeof social_notifications !== 'boolean' ||
      typeof announcements !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'All preferences must be boolean values' },
        { status: 400 }
      )
    }

    const adminSupabase = createAdminClient()

    // Ensure preferences exist
    await initializeUserEmailPreferences(user.id).catch(() => {
      // Ignore if already exists
    })

    // Update preferences
    const { data: updated, error } = await adminSupabase
      .from('user_email_preferences')
      .update({
        selling_notifications,
        buying_notifications,
        social_notifications,
        announcements,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating email preferences:', error)
      return NextResponse.json(
        { error: 'Failed to update email preferences' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      preferences: updated,
      message: 'Email preferences updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/settings/email-preferences:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getUserEmailPreferences(userId: string) {
  const adminSupabase = createAdminClient()
  const { data, error } = await adminSupabase
    .from('user_email_preferences')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error && error.code !== 'PGRST116') {
    throw error
  }

  if (!data) {
    return {
      user_id: userId,
      selling_notifications: true,
      buying_notifications: true,
      social_notifications: true,
      announcements: true,
    }
  }

  return data
}
