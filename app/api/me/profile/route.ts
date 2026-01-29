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
      display_name,
      bio,
      subjects_taught,
      grade_levels_taught,
      teaching_class_types,
      teaching_learner_paths,
      teaching_strand_ids,
      teaching_sped_level_ids,
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

    // Validate display_name length (0-255 chars, optional)
    if (display_name !== undefined) {
      const trimmed = typeof display_name === 'string' ? display_name.trim() : ''
      if (trimmed.length > 255) {
        return NextResponse.json(
          { error: 'Display name must be 255 characters or less' },
          { status: 400 }
        )
      }
    }

    // Validate bio length (max 5000 chars)
    if (bio !== undefined && bio.length > 5000) {
      return NextResponse.json({ error: 'Bio must be 5000 characters or less' }, { status: 400 })
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

    // Validate Phase 2 teaching preferences
    if (teaching_class_types !== undefined) {
      if (!Array.isArray(teaching_class_types)) {
        return NextResponse.json(
          { error: 'teaching_class_types must be an array' },
          { status: 400 }
        )
      }
      const validClassTypes = ['regular', 'sped']
      const invalidTypes = teaching_class_types.filter((t: string) => !validClassTypes.includes(t))
      if (invalidTypes.length > 0) {
        return NextResponse.json(
          { error: `Invalid class types: ${invalidTypes.join(', ')}` },
          { status: 400 }
        )
      }
    }

    if (teaching_learner_paths !== undefined) {
      if (!Array.isArray(teaching_learner_paths)) {
        return NextResponse.json(
          { error: 'teaching_learner_paths must be an array' },
          { status: 400 }
        )
      }
      const validPaths = ['graded', 'non_graded']
      const invalidPaths = teaching_learner_paths.filter((p: string) => !validPaths.includes(p))
      if (invalidPaths.length > 0) {
        return NextResponse.json(
          { error: `Invalid learner paths: ${invalidPaths.join(', ')}` },
          { status: 400 }
        )
      }
      // Validate that SPED is selected if learner paths are provided
      if (teaching_learner_paths.length > 0 && teaching_class_types !== undefined && !teaching_class_types.includes('sped')) {
        return NextResponse.json(
          { error: 'Learner paths can only be set when SPED class type is selected' },
          { status: 400 }
        )
      }
    }

    if (teaching_strand_ids !== undefined) {
      if (!Array.isArray(teaching_strand_ids)) {
        return NextResponse.json(
          { error: 'teaching_strand_ids must be an array' },
          { status: 400 }
        )
      }
      // Validate UUIDs format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const invalidUuids = teaching_strand_ids.filter((id: string) => !uuidRegex.test(id))
      if (invalidUuids.length > 0) {
        return NextResponse.json(
          { error: 'Invalid strand UUID format' },
          { status: 400 }
        )
      }
      // Validate that strands exist in database
      if (teaching_strand_ids.length > 0) {
        const { data: existingStrands } = await supabase
          .from('strands')
          .select('id')
          .in('id', teaching_strand_ids)
        const existingIds = (existingStrands || []).map((s: { id: string }) => s.id)
        const missingIds = teaching_strand_ids.filter((id: string) => !existingIds.includes(id))
        if (missingIds.length > 0) {
          return NextResponse.json(
            { error: `Invalid strand IDs: ${missingIds.join(', ')}` },
            { status: 400 }
          )
        }
      }
    }

    if (teaching_sped_level_ids !== undefined) {
      if (!Array.isArray(teaching_sped_level_ids)) {
        return NextResponse.json(
          { error: 'teaching_sped_level_ids must be an array' },
          { status: 400 }
        )
      }
      // Validate UUIDs format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      const invalidUuids = teaching_sped_level_ids.filter((id: string) => !uuidRegex.test(id))
      if (invalidUuids.length > 0) {
        return NextResponse.json(
          { error: 'Invalid SPED level UUID format' },
          { status: 400 }
        )
      }
      // Validate that SPED levels exist in database
      if (teaching_sped_level_ids.length > 0) {
        const { data: existingLevels } = await supabase
          .from('sped_levels')
          .select('id')
          .in('id', teaching_sped_level_ids)
        const existingIds = (existingLevels || []).map((l: { id: string }) => l.id)
        const missingIds = teaching_sped_level_ids.filter((id: string) => !existingIds.includes(id))
        if (missingIds.length > 0) {
          return NextResponse.json(
            { error: `Invalid SPED level IDs: ${missingIds.join(', ')}` },
            { status: 400 }
          )
        }
      }
    }

    // Build update object (only include provided fields)
    const updateData: any = {}
    if (first_name !== undefined) updateData.first_name = first_name
    if (last_name !== undefined) updateData.last_name = last_name || ''
    if (username !== undefined) updateData.username = username
    if (display_name !== undefined) {
      updateData.display_name =
        typeof display_name === 'string' && display_name.trim() ? display_name.trim() : null
    }
    if (bio !== undefined) updateData.bio = bio
    if (subjects_taught !== undefined) updateData.subjects_taught = subjects_taught
    if (grade_levels_taught !== undefined) updateData.grade_levels_taught = grade_levels_taught
    if (teaching_class_types !== undefined) updateData.teaching_class_types = teaching_class_types
    if (teaching_learner_paths !== undefined) updateData.teaching_learner_paths = teaching_learner_paths
    if (teaching_strand_ids !== undefined) updateData.teaching_strand_ids = teaching_strand_ids
    if (teaching_sped_level_ids !== undefined) updateData.teaching_sped_level_ids = teaching_sped_level_ids
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
