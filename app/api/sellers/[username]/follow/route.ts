import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { getFullName } from '@/lib/utils/profile'

/**
 * POST /api/sellers/[username]/follow
 * Follow a seller
 * 
 * Requires authentication
 * Cannot follow yourself
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get seller by username
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id, role')
      .eq('username', username)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const sellerId = seller.id

    // Check not following self
    if (authUser.id === sellerId) {
      return NextResponse.json({ error: 'Cannot follow yourself' }, { status: 400 })
    }

    if (seller.role !== 'seller' && seller.role !== 'admin') {
      return NextResponse.json({ error: 'User is not a seller' }, { status: 400 })
    }

    // Check if already following
    const { data: existingFollow, error: checkError } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', authUser.id)
      .eq('following_id', sellerId)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = no rows returned (expected if not following)
      console.error('Error checking follow status:', checkError)
      return NextResponse.json({ error: 'Failed to check follow status' }, { status: 500 })
    }

    if (existingFollow) {
      return NextResponse.json({ error: 'Already following this seller' }, { status: 400 })
    }

    // Insert follow relationship
    const { error: insertError } = await supabase.from('followers').insert({
      follower_id: authUser.id,
      following_id: sellerId,
    })

    if (insertError) {
      console.error('Error following seller:', insertError)
      return NextResponse.json({ error: 'Failed to follow seller' }, { status: 500 })
    }

    // Get updated follower count
    const { data: sellerData } = await supabase
      .from('users')
      .select('followers_count')
      .eq('id', sellerId)
      .single()

    // Create notification for seller
    try {
      const { createNewFollowerNotification } = await import('@/lib/notifications/notification-triggers')
      const { data: followerData } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .eq('id', authUser.id)
        .single()

      if (followerData) {
        await createNewFollowerNotification(
          sellerId,
          authUser.id,
          getFullName(followerData) || 'A teacher'
        )
      }
    } catch (notificationError) {
      // Don't fail follow action if notification fails
      console.error('Error creating follower notification:', notificationError)
    }

    return NextResponse.json({
      success: true,
      followers_count: sellerData?.followers_count || 0,
    })
  } catch (error) {
    console.error('Error following seller:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/sellers/[username]/follow
 * Unfollow a seller
 * 
 * Requires authentication
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get seller by username
    const { data: seller, error: sellerError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (sellerError || !seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const sellerId = seller.id

    // Delete follow relationship
    const { error: deleteError } = await supabase
      .from('followers')
      .delete()
      .eq('follower_id', authUser.id)
      .eq('following_id', sellerId)

    if (deleteError) {
      console.error('Error unfollowing seller:', deleteError)
      return NextResponse.json({ error: 'Failed to unfollow seller' }, { status: 500 })
    }

    // Get updated follower count
    const { data: sellerData } = await supabase
      .from('users')
      .select('followers_count')
      .eq('id', sellerId)
      .single()

    return NextResponse.json({
      success: true,
      followers_count: sellerData?.followers_count || 0,
    })
  } catch (error) {
    console.error('Error unfollowing seller:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
