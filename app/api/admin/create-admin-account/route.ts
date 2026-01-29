import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * API Route to create a super admin account
 * 
 * POST /api/admin/create-admin-account
 * Headers: X-Create-Super-Admin-Secret: <secret> (required if CREATE_SUPER_ADMIN_SECRET env is set)
 * Body: { 
 *   email: string, 
 *   password?: string,
 *   name?: string,  // OR
 *   first_name?: string,
 *   last_name?: string
 * }
 * 
 * This endpoint requires the SUPABASE_SERVICE_ROLE_KEY to be set.
 * In production, set CREATE_SUPER_ADMIN_SECRET env var and include it in the request header.
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
    // Check for secret protection (if env var is set)
    const requiredSecret = process.env.CREATE_SUPER_ADMIN_SECRET
    if (requiredSecret) {
      const providedSecret = request.headers.get('X-Create-Super-Admin-Secret')
      if (!providedSecret || providedSecret !== requiredSecret) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid or missing secret' },
          { status: 403 }
        )
      }
    }

    const body = await request.json()
    const { email, password, name, first_name, last_name } = body

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      )
    }

    // Derive first_name and last_name
    let finalFirstName: string
    let finalLastName: string
    
    if (first_name && last_name) {
      finalFirstName = first_name.trim()
      finalLastName = last_name.trim()
    } else if (name) {
      const split = splitName(name)
      finalFirstName = split.first_name
      finalLastName = split.last_name
    } else {
      const split = splitName(email.split('@')[0])
      finalFirstName = split.first_name
      finalLastName = split.last_name
    }

    const supabase = createAdminClient()

    // Generate a secure random password if not provided
    const tempPassword = password || generateTempPassword()

    // Step 1: Create user in Supabase Auth
    // Pass name in metadata for trigger, and also first_name/last_name for consistency
    const fullName = name || `${finalFirstName} ${finalLastName}`.trim() || email.split('@')[0]
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
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

    // Step 2: Wait for trigger to create profile, then update it
    await new Promise(resolve => setTimeout(resolve, 500))

    const username = fullName
      .toLowerCase()
      .replace(/\s+/g, '_')
      .substring(0, 20)

    // Step 3: Update the user profile with admin details
    const { error: profileError } = await supabase
      .from('users')
      .update({
        username: username,
        role: 'admin',
        admin_role: 'super_admin',
        is_verified_teacher: false,
        can_sell: false,
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq('id', authData.user.id)

    if (profileError) {
      // If update fails, check if profile exists (trigger may have created it)
      const { data: existingProfile } = await supabase
        .from('users')
        .select('id')
        .eq('id', authData.user.id)
        .single()

      if (!existingProfile) {
        // Profile doesn't exist, create it manually
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            first_name: finalFirstName,
            last_name: finalLastName,
            username: username,
            role: 'admin',
            admin_role: 'super_admin',
            is_verified_teacher: false,
            can_sell: false,
            email_verified: true,
            email_verified_at: new Date().toISOString(),
          })

        if (insertError) {
          console.error('Error creating user profile:', insertError)
          await supabase.auth.admin.deleteUser(authData.user.id)
          return NextResponse.json(
            { error: 'Failed to create user profile', details: insertError.message },
            { status: 500 }
          )
        }
      } else {
        // Profile exists but update failed - try update again
        console.error('Error updating user profile:', profileError)
        return NextResponse.json(
          { error: 'Failed to update user profile', details: profileError.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Super admin account created successfully',
      data: {
        email,
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
