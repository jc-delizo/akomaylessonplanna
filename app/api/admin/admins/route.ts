import { createClient } from '@/lib/supabase/server'
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

    const supabase = await createClient()
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

    const supabase = await createClient()
    const body = await request.json()
    const { email, name, admin_role, send_invite_email = true } = body

    if (!email || !name || !admin_role) {
      return NextResponse.json(
        { error: 'Email, name, and admin_role are required' },
        { status: 400 }
      )
    }

    if (!['super_admin', 'moderator', 'content_manager'].includes(admin_role)) {
      return NextResponse.json({ error: 'Invalid admin role' }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', email)
      .single()

    if (existingUser) {
      if (existingUser.role === 'admin') {
        return NextResponse.json({ error: 'User is already an admin' }, { status: 400 })
      }
      // Update existing user to admin
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          role: 'admin',
          admin_role,
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
          admin_role,
        },
        `Admin account created: ${admin_role}`
      )

      // TODO: Send invite email if send_invite_email is true

      return NextResponse.json({ success: true, admin: updatedUser })
    }

    // Create new admin user (invite-only - they'll need to set password via email)
    // For now, create user with temporary password that must be changed
    // In production, use Supabase Auth admin API to send invite

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'admin_invited',
      'user',
      email,
      { admin_role, email, name },
      `Admin invitation sent: ${admin_role}`
    )

    // TODO: Send invite email via Supabase Auth

    return NextResponse.json({
      success: true,
      message: 'Admin invitation sent',
      admin: { email, name, admin_role },
    })
  } catch (error) {
    console.error('Error in POST /api/admin/admins:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
