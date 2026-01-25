import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { calculateProfileCompletion, validateUsername } from '@/lib/utils/profile'

/**
 * GET /api/me/profile
 * Get current user's own profile (with private data)
 * 
 * Requires authentication
 * Returns full profile including email and private fields
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch full user profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Recalculate profile completion
    const completionPercent = calculateProfileCompletion(user as any)

    return NextResponse.json({
      profile: {
        ...user,
        profile_completion_percent: completionPercent,
      },
    })
  } catch (error) {
    console.error('Error fetching profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/me/profile
 * Update current user's profile
 * 
 * Requires authentication
 * Validates input and recalculates profile completion
 */
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      first_name,
      last_name,
      username,
      bio,
      subjects_taught,
      grade_levels_taught,
      location_city,
      location_region,
      social_links,
      custom_accent_color,
    } = body

    // Validate username if provided
    if (username !== undefined) {
      const usernameValidation = validateUsername(username)
      if (!usernameValidation.valid) {
        return NextResponse.json({ error: usernameValidation.error }, { status: 400 })
      }

      // Check uniqueness (excluding current user)
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('username', username)
        .neq('id', authUser.id)
        .single()

      if (existingUser) {
        return NextResponse.json({ error: 'Username already taken' }, { status: 400 })
      }
    }

    // Validate bio length (max 500 chars)
    if (bio !== undefined && bio.length > 500) {
      return NextResponse.json({ error: 'Bio must be 500 characters or less' }, { status: 400 })
    }

    // Validate first_name length (1-255 chars)
    if (first_name !== undefined) {
      if (first_name.length < 1 || first_name.length > 255) {
        return NextResponse.json(
          { error: 'First name must be between 1 and 255 characters' },
          { status: 400 }
        )
      }
    }

    // Validate last_name length (0-255 chars, can be empty)
    if (last_name !== undefined && last_name.length > 255) {
      return NextResponse.json(
        { error: 'Last name must be 255 characters or less' },
        { status: 400 }
      )
    }

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name || ''
    if (username !== undefined) updateData.username = username
    if (bio !== undefined) updateData.bio = bio
    if (subjects_taught !== undefined) updateData.subjects_taught = subjects_taught
    if (grade_levels_taught !== undefined) updateData.grade_levels_taught = grade_levels_taught
    if (location_city !== undefined) updateData.location_city = location_city
    if (location_region !== undefined) updateData.location_region = location_region
    if (social_links !== undefined) updateData.social_links = social_links
    if (custom_accent_color !== undefined) {
      // Only allow if Pro or Pioneer
      const { data: currentUser } = await supabase
        .from('users')
        .select('subscription_tier')
        .eq('id', authUser.id)
        .single()

      if (
        currentUser?.subscription_tier === 'pro' ||
        currentUser?.subscription_tier === 'pioneer'
      ) {
        updateData.custom_accent_color = custom_accent_color
      } else {
        return NextResponse.json(
          { error: 'Custom accent color is only available for Pro and Pioneer sellers' },
          { status: 403 }
        )
      }
    }

    // Update user profile
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', authUser.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    // Recalculate profile completion
    const completionPercent = calculateProfileCompletion(updatedUser as any)

    // Update profile_completion_percent
    await supabase
      .from('users')
      .update({ profile_completion_percent: completionPercent })
      .eq('id', authUser.id)

    return NextResponse.json({
      profile: {
        ...updatedUser,
        profile_completion_percent: completionPercent,
      },
    })
  } catch (error) {
    console.error('Error updating profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
