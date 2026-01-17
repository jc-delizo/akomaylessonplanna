import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * API Route to create a system admin account
 * 
 * POST /api/admin/create-admin-account
 * Body: { email: string, name?: string, password?: string }
 * 
 * This endpoint requires the SUPABASE_SERVICE_ROLE_KEY to be set.
 * It should be protected in production (e.g., require a secret token).
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, name, password } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Generate a secure random password if not provided
    const tempPassword = password || generateTempPassword()

    // Step 1: Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true, // Auto-confirm email for admin
      user_metadata: {
        name: name || email.split('@')[0],
        role: 'admin',
      },
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return NextResponse.json(
        { error: 'Failed to create auth user', details: authError.message },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create auth user' },
        { status: 500 }
      )
    }

    // Step 2: Create user profile in public.users table
    const username = name 
      ? name.toLowerCase().replace(/\s+/g, '_').substring(0, 20)
      : email.split('@')[0].substring(0, 20)

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email: email,
        name: name || email.split('@')[0],
        username: username,
        role: 'admin',
        is_verified_teacher: false,
        can_sell: false,
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })

    if (profileError) {
      // If profile creation fails, try to clean up auth user
      console.error('Error creating user profile:', profileError)
      await supabase.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: 'Failed to create user profile', details: profileError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        email,
        name: name || email.split('@')[0],
        username,
        role: 'admin',
        email_verified: true,
        tempPassword: password ? undefined : tempPassword, // Only return temp password if it was generated
      },
    })

  } catch (error) {
    console.error('Error creating admin account:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

function generateTempPassword(): string {
  // Generate a secure random password
  const length = 16
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}
