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
          first_name,
          last_name,
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
    const following = follows?.map((follow) => {
      const seller = Array.isArray(follow.seller) ? follow.seller[0] : follow.seller
      if (!seller) return null
      return {
        id: seller.id,
        name: `${seller.first_name} ${seller.last_name || ''}`.trim(), // For backward compatibility
        first_name: seller.first_name,
        last_name: seller.last_name,
        username: seller.username,
        avatar_url: seller.avatar_url,
        bio: seller.bio,
        is_verified_teacher: seller.is_verified_teacher,
        subscription_tier: seller.subscription_tier,
        is_pioneer: seller.is_pioneer,
        followers_count: seller.followers_count,
        followed_at: follow.created_at,
      }
    }).filter(Boolean)

    return NextResponse.json({
      following: following || [],
      total: following?.length || 0,
    })
  } catch (error) {
    console.error('Error fetching following list:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
