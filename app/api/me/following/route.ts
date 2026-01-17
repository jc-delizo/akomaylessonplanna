import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/me/following
 * Get list of sellers the current user is following
 * 
 * Requires authentication
 * Returns basic profile info for each followed seller
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

    // Get list of followed sellers
    const { data: follows, error: followsError } = await supabase
      .from('followers')
      .select(
        `
        following_id,
        created_at,
        seller:users!followers_following_id_fkey(
          id,
          name,
          username,
          avatar_url,
          bio,
          is_verified_teacher,
          subscription_tier,
          is_pioneer,
          followers_count
        )
      `
      )
      .eq('follower_id', authUser.id)
      .order('created_at', { ascending: false })

    if (followsError) {
      console.error('Error fetching following list:', followsError)
      return NextResponse.json({ error: 'Failed to fetch following list' }, { status: 500 })
    }

    // Format response
    const following = follows?.map((follow) => ({
      id: follow.seller.id,
      name: follow.seller.name,
      username: follow.seller.username,
      avatar_url: follow.seller.avatar_url,
      bio: follow.seller.bio,
      is_verified_teacher: follow.seller.is_verified_teacher,
      subscription_tier: follow.seller.subscription_tier,
      is_pioneer: follow.seller.is_pioneer,
      followers_count: follow.seller.followers_count,
      followed_at: follow.created_at,
    }))

    return NextResponse.json({
      following: following || [],
      total: following?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching following list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
