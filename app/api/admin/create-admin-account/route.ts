import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { randomBytes, randomInt } from 'node:crypto'
import { secretsMatch } from '@/lib/security/request-security'

/**
 * API Route to create a super admin account
 * 
 * POST /api/admin/create-admin-account
 * Headers: X-Create-Super-Admin-Secret: <secret> (required)
 * Body: { 
 *   email: string, 
 *   password?: string,
 *   name?: string,  // OR
 *   first_name?: string,
 *   last_name?: string
 * }
 * 
 * This endpoint requires the SUPABASE_SERVICE_ROLE_KEY to be set.
 * The endpoint fails closed unless CREATE_SUPER_ADMIN_SECRET is configured.
 */

function splitName(fullName: string): { first_name: string; last_name: string } {
  const trimmed = fullName.trim()
  const spaceIndex = trimmed.indexOf(' ')
  
  if (spaceIndex === -1) {
    return { first_name: trimmed || 'User', last_name: '' }
  }
  
  return {
    first_name: trimmed.substring(0, spaceIndex),
    last_name: trimmed.substring(spaceIndex + 1).trim(),
  }
}

export async function POST(request: NextRequest) {
  try {
    const requiredSecret = process.env.CREATE_SUPER_ADMIN_SECRET
    if (!requiredSecret) {
      console.error('CREATE_SUPER_ADMIN_SECRET is not configured')
      return NextResponse.json(
        { error: 'Administrator setup is not configured' },
        { status: 503 }
      )
    }

    const providedSecret = request.headers.get('X-Create-Super-Admin-Secret')
    if (!secretsMatch(providedSecret, requiredSecret)) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing secret' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, name, first_name, last_name } = body
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : ''

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    if (password !== undefined && (typeof password !== 'string' || password.length < 12)) {
      return NextResponse.json(
        { error: 'Password must contain at least 12 characters' },
        { status: 400 }
      )
    }

    // Derive first_name and last_name
    let finalFirstName: string
    let finalLastName: string
    
    if (typeof first_name === 'string' && typeof last_name === 'string' && first_name.trim()) {
      finalFirstName = first_name.trim()
      finalLastName = last_name.trim()
    } else if (typeof name === 'string' && name.trim()) {
      const split = splitName(name)
      finalFirstName = split.first_name
      finalLastName = split.last_name
    } else {
      const split = splitName(normalizedEmail.split('@')[0])
      finalFirstName = split.first_name
      finalLastName = split.last_name
    }

    if (finalFirstName.length > 255 || finalLastName.length > 255) {
      return NextResponse.json(
        { error: 'First and last names must be 255 characters or fewer' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // This bootstrap endpoint is only for the first super administrator.
    const { count: existingSuperAdmins, error: existingAdminError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('admin_role', 'super_admin')

    if (existingAdminError) {
      console.error('Unable to check existing super administrators:', existingAdminError)
      return NextResponse.json({ error: 'Unable to verify setup state' }, { status: 500 })
    }

    if ((existingSuperAdmins ?? 0) > 0) {
      return NextResponse.json(
        { error: 'Administrator setup has already been completed' },
        { status: 409 }
      )
    }

    // Generate a secure random password if not provided
    const tempPassword = password || generateTempPassword()

    // Step 1: Create user in Supabase Auth
    // Pass name in metadata for trigger, and also first_name/last_name for consistency
    const fullName =
      (typeof name === 'string' ? name.trim() : '') ||
      `${finalFirstName} ${finalLastName}`.trim() ||
      normalizedEmail.split('@')[0]
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: normalizedEmail,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email for admin
      user_metadata: {
        name: fullName,
        first_name: finalFirstName,
        last_name: finalLastName,
        role: 'admin',
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: 'Failed to create administrator account' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user' },
        { status: 500 }
      )
    }

    const usernameBase = fullName
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, '_')
      .replace(/^_+|_+$/g, '') || 'admin'
    const username = `${usernameBase.slice(0, 13)}_${randomBytes(3).toString('hex')}`

    // The database lock makes the first-admin promotion safe against two
    // simultaneous bootstrap requests. The auth trigger must have created the
    // corresponding public profile before this call.
    const { data: promoted, error: profileError } = await supabase.rpc(
      'promote_initial_super_admin',
      {
        p_user_id: authData.user.id,
        p_username: username,
      }
    )

    if (profileError || promoted !== true) {
      console.error('Error promoting initial super administrator:', profileError)
      await supabase.auth.admin.deleteUser(authData.user.id)

      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'admin')
        .eq('admin_role', 'super_admin')

      return NextResponse.json(
        {
          error: (count ?? 0) > 0
            ? 'Administrator setup has already been completed'
            : 'Failed to create administrator profile',
        },
        { status: (count ?? 0) > 0 ? 409 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Super admin account created successfully',
      data: {
        email: normalizedEmail,
        name: fullName,
        first_name: finalFirstName,
        last_name: finalLastName,
        username,
        role: 'admin',
        admin_role: 'super_admin',
        email_verified: true,
        tempPassword: password ? undefined : tempPassword, // Only return temp password if it was generated
      },
    })

  } catch (error) {
    console.error('Error creating admin account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateTempPassword(): string {
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(randomInt(charset.length))
  }
  return password
}
