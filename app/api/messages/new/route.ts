import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/messages/new
 * Polling endpoint for new messages (30s intervals)
 * Query params: after (timestamp), conversation_id (optional)
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

    const { searchParams } = new URL(request.url)
    const after = searchParams.get('after') // timestamp
    const conversationId = searchParams.get('conversation_id') // optional

    // Build query for new messages
    let query = supabase
      .from('messages')
      .select(
        `
        *,
        sender:sender_id(id, name, username, avatar_url),
        conversation:conversation_id(id, buyer_id, seller_id, product_id)
      `
      )
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(50)

    // Filter by conversation if provided
    if (conversationId) {
      query = query.eq('conversation_id', conversationId)
    } else {
      // Get all conversations user is part of
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

      const convIds = conversations?.map((c) => c.id) || []
      if (convIds.length === 0) {
        return NextResponse.json({ messages: [] })
      }
      query = query.in('conversation_id', convIds)
    }

    // Filter by timestamp if provided
    if (after) {
      query = query.gt('created_at', after)
    } else {
      // Default: last 5 minutes
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      query = query.gt('created_at', fiveMinutesAgo)
    }

    // Only get messages not sent by current user
    query = query.neq('sender_id', user.id)

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching new messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch new messages' },
        { status: 500 }
      )
    }

    // Filter to only include messages from conversations user is part of
    const filteredMessages = (messages || []).filter((msg) => {
      const conv = msg.conversation
      return (
        conv &&
        (conv.buyer_id === user.id || conv.seller_id === user.id)
      )
    })

    return NextResponse.json({ messages: filteredMessages || [] })
  } catch (error) {
    console.error('Error in GET /api/messages/new:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
