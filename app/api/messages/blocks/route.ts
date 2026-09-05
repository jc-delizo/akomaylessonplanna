import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/messages/blocks
 * Get list of blocked users
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get all blocks by this user
    const { data: blocks, error } = await supabase
      .from('user_blocks')
      .select(
        `
        *,
        blocked_user:blocked_id(id, first_name, last_name, username, avatar_url)
      `
      )
      .eq('blocker_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching blocks:', error)
      return NextResponse.json(
        { error: 'Failed to fetch blocked users' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      blocks: blocks || [],
    })
  } catch (error) {
    console.error('Error in GET /api/messages/blocks:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
