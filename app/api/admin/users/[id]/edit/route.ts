import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/middleware/admin-auth'

/**
 * PUT /api/admin/users/[id]/edit
 * Edit user profile (first_name, last_name, username, bio, tier, ban status)
 * 
 * Body:
 * - first_name?: string
 * - last_name?: string
 * - username?: string
 * - bio?: string
 * - subscription_tier?: 'free' | 'pro' | 'pioneer'
 * - is_banned?: boolean
 * - ban_reason?: string
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { id: userId } = await params
    const supabase = createAdminClient()
    const body = await request.json()

    // Get current user data for audit log
    const { data: currentUser } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (!currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Require reason for destructive changes (is_banned, subscription_tier)
    const changingBan = body.is_banned !== undefined && body.is_banned !== currentUser.is_banned
    const changingTier = body.subscription_tier !== undefined && body.subscription_tier !== currentUser.subscription_tier
    if ((changingBan || changingTier) && (!body.reason || !String(body.reason).trim())) {
      return NextResponse.json(
        { error: 'Reason is required when changing ban status or subscription tier' },
        { status: 400 }
      )
    }

    // Build update object
    const updates: Record<string, unknown> = {}
    const changes: Record<string, { from: unknown; to: unknown }> = {}

    if (body.first_name !== undefined && body.first_name !== currentUser.first_name) {
      updates.first_name = body.first_name
      changes.first_name = { from: currentUser.first_name, to: body.first_name }
    }

    if (body.last_name !== undefined && body.last_name !== currentUser.last_name) {
      updates.last_name = body.last_name || ''
      changes.last_name = { from: currentUser.last_name, to: body.last_name || '' }
    }

    if (body.username !== undefined && body.username !== currentUser.username) {
      updates.username = body.username
      changes.username = { from: currentUser.username, to: body.username }
    }

    if (body.bio !== undefined && body.bio !== currentUser.bio) {
      updates.bio = body.bio
      changes.bio = { from: currentUser.bio, to: body.bio }
    }

    if (body.subscription_tier !== undefined && body.subscription_tier !== currentUser.subscription_tier) {
      updates.subscription_tier = body.subscription_tier
      changes.subscription_tier = { from: currentUser.subscription_tier, to: body.subscription_tier }
    }

    if (body.is_banned !== undefined && body.is_banned !== currentUser.is_banned) {
      updates.is_banned = body.is_banned
      changes.is_banned = { from: currentUser.is_banned, to: body.is_banned }
    }

    if (body.ban_reason !== undefined) {
      updates.ban_reason = body.ban_reason
      changes.ban_reason = { from: currentUser.ban_reason, to: body.ban_reason }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ message: 'No changes to apply' })
    }

    // Update user
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'user_edited',
      'user',
      userId,
      changes,
      body.reason || 'User profile updated'
    )

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error in PUT /api/admin/users/[id]/edit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
