import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/seller/settings/account
 * Update account settings
 * Body: { display_name, avatar_url, bio }
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

    // Verify user is a seller
    const { data: userData } = await supabase
      .from('users')
      .select('can_sell')
      .eq('id', user.id)
      .single()

    if (!userData?.can_sell) {
      return NextResponse.json(
        { error: 'Only sellers can update account settings' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { display_name, avatar_url, bio } = body

    // Build update object
    const updates: Record<string, string | null> = {}
    if (display_name !== undefined) {
      if (display_name !== null && typeof display_name !== 'string') {
        return NextResponse.json({ error: 'display_name must be a string' }, { status: 400 })
      }
      updates.display_name = display_name?.trim() || null
    }
    if (avatar_url !== undefined) {
      if (avatar_url !== null && typeof avatar_url !== 'string') {
        return NextResponse.json({ error: 'avatar_url must be a string' }, { status: 400 })
      }
      const normalizedAvatarUrl = avatar_url?.trim() || null
      if (normalizedAvatarUrl && (normalizedAvatarUrl.length > 2048 || !/^https:\/\//i.test(normalizedAvatarUrl))) {
        return NextResponse.json({ error: 'avatar_url must be a valid HTTPS URL' }, { status: 400 })
      }
      updates.avatar_url = normalizedAvatarUrl
    }
    if (bio !== undefined) {
      if (bio !== null && typeof bio !== 'string') {
        return NextResponse.json({ error: 'bio must be a string' }, { status: 400 })
      }
      updates.bio = bio?.trim() || null
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    // Validate display name
    if (
      updates.display_name &&
      (updates.display_name.length < 2 || updates.display_name.length > 255)
    ) {
      return NextResponse.json(
        { error: 'Display name must be between 2 and 255 characters' },
        { status: 400 }
      )
    }

    // Validate bio
    if (updates.bio !== undefined && updates.bio && updates.bio.length > 1000) {
      return NextResponse.json(
        { error: 'Bio must be less than 1000 characters' },
        { status: 400 }
      )
    }

    updates.updated_at = new Date().toISOString()

    // Update user
    const { data: updated, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', user.id)
      .select('id, first_name, last_name, display_name, username, avatar_url, bio')
      .single()

    if (updateError) {
      console.error('Error updating account settings:', updateError)
      return NextResponse.json(
        { error: 'Failed to update account settings' },
        { status: 500 }
      )
    }

    return NextResponse.json({ account: updated })
  } catch (error) {
    console.error('Error in PUT /api/seller/settings/account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
