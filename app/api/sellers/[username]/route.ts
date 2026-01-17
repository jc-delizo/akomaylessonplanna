import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { User } from '@/lib/utils/profile'

/**
 * GET /api/sellers/[username]
 * Get public seller profile by username
 * 
 * Returns only public fields (per design doc):
 * - Display name, avatar, bio, subjects, grades, location
 * - Stats: products count, sales count, rating, followers
 * - Badges, member since date
 * 
 * Also tracks profile view in profile_views table
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const supabase = await createClient()

    // Get current user (if authenticated) for tracking views
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    // Fetch user by username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select(
        `
        id,
        name,
        username,
        avatar_url,
        bio,
        subjects_taught,
        grade_levels_taught,
        location_city,
        location_region,
        social_links,
        banner_url,
        custom_accent_color,
        profile_completion_percent,
        followers_count,
        response_time_hours,
        role,
        is_verified_teacher,
        can_sell,
        subscription_tier,
        is_pioneer,
        created_at
      `
      )
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Only return seller profiles (or admin for testing)
    if (user.role !== 'seller' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Track profile view (insert into profile_views)
    // This is done asynchronously, so we don't wait for it
    supabase
      .from('profile_views')
      .insert({
        profile_user_id: user.id,
        viewer_id: authUser?.id || null,
      })
      .catch((error) => {
        // Log error but don't fail the request
        console.error('Failed to track profile view:', error)
      })

    // Get products count (when products table exists)
    // For now, return 0
    const productsCount = 0

    // Get sales count (when orders exist)
    // For now, return 0
    const salesCount = 0

    // Get average rating (when reviews exist)
    // For now, return null
    const avgRating = null

    // Build public profile response (only public fields)
    const publicProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      avatar_url: user.avatar_url,
      bio: user.bio,
      subjects_taught: user.subjects_taught || [],
      grade_levels_taught: user.grade_levels_taught || [],
      location_city: user.location_city,
      location_region: user.location_region,
      social_links: user.social_links,
      banner_url: user.banner_url,
      custom_accent_color: user.custom_accent_color,
      followers_count: user.followers_count,
      response_time_hours: user.response_time_hours,
      role: user.role,
      is_verified_teacher: user.is_verified_teacher,
      subscription_tier: user.subscription_tier,
      is_pioneer: user.is_pioneer,
      created_at: user.created_at,
      // Stats
      products_count: productsCount,
      sales_count: salesCount,
      avg_rating: avgRating,
    }

    return NextResponse.json({ profile: publicProfile })
  } catch (error) {
    console.error('Error fetching seller profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
