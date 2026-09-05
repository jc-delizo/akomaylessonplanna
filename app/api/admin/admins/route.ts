import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { getAdminsData } from '@/lib/utils/admin-admins'

/**
 * GET /api/admin/admins
 * List all admins (Super Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const result = await getAdminsData(supabase)
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/admin/admins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/admin/admins
 * Create new admin account (Super Admin only, invite-only)
 * 
 * Body:
 * - email: string (required)
 * - name: string (required)
 * - admin_role: 'super_admin' | 'moderator' | 'content_manager' (required)
 * - send_invite_email: boolean (default: true)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const input = body as Record<string, unknown>
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    const name = typeof input.name === 'string' ? input.name.trim() : ''
    const adminRole = typeof input.admin_role === 'string' ? input.admin_role : ''
    const sendInviteEmail = input.send_invite_email ?? true

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json(
        { error: 'A valid email is required' },
        { status: 400 }
      )
    }

    if (!name || name.length > 200) {
      return NextResponse.json({ error: 'Name must be between 1 and 200 characters' }, { status: 400 })
    }

    if (!['super_admin', 'moderator', 'content_manager'].includes(adminRole)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 400 })
    }

    if (typeof sendInviteEmail !== 'boolean') {
      return NextResponse.json({ error: 'send_invite_email must be a boolean' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser, error: lookupError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', email)
      .maybeSingle()

    if (lookupError) {
      console.error('Error checking existing admin account:', lookupError)
      return NextResponse.json({ error: 'Failed to verify admin account' }, { status: 500 })
    }

    if (existingUser) {
      if (existingUser.role === 'admin') {
        return NextResponse.json({ error: 'User is already an admin' }, { status: 400 })
      }
      // Update existing user to admin
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          admin_role: adminRole,
        })
        .eq('id', existingUser.id)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating user to admin:', updateError)
        return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 })
      }

      // Log action
      await logAdminAction(
        authResult.admin.userId,
        'admin_created',
        'user',
        existingUser.id,
        {
          role: { from: existingUser.role, to: 'admin' },
          admin_role: adminRole,
        },
        `Admin account created: ${adminRole}`
      )

      return NextResponse.json({
        success: true,
        admin: updatedUser,
        invitation_sent: false,
        message: 'Existing user promoted to administrator',
      })
    }

    if (!sendInviteEmail) {
      return NextResponse.json(
        { error: 'New administrators must be provisioned through a verified email invitation' },
        { status: 400 }
      )
    }

    const [firstName, ...lastNameParts] = name.split(/\s+/)
    const lastName = lastNameParts.join(' ')
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, '')

    const { data: invited, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${appUrl}/reset-password`,
        data: {
          name,
          first_name: firstName,
          last_name: lastName,
        },
      }
    )

    if (inviteError || !invited.user) {
      console.error('Error inviting administrator:', inviteError)
      return NextResponse.json(
        { error: 'Failed to send administrator invitation' },
        { status: 502 }
      )
    }

    const { data: invitedAdmin, error: profileError } = await supabase
      .from('users')
      .update({
        first_name: firstName,
        last_name: lastName,
        role: 'admin',
        admin_role: adminRole,
      })
      .eq('id', invited.user.id)
      .select('id, first_name, last_name, email, avatar_url, admin_role, created_at, updated_at')
      .single()

    if (profileError || !invitedAdmin) {
      console.error('Error promoting invited administrator:', profileError)
      await supabase.auth.admin.deleteUser(invited.user.id)
      return NextResponse.json(
        { error: 'Invitation was rolled back because the administrator profile could not be created' },
        { status: 500 }
      )
    }

    await logAdminAction(
      authResult.admin.userId,
      'admin_invited',
      'user',
      invited.user.id,
      { admin_role: adminRole, email, name },
      `Admin invitation sent: ${adminRole}`
    )

    return NextResponse.json({
      success: true,
      message: 'Admin invitation sent',
      invitation_sent: true,
      admin: invitedAdmin,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/admin/admins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
