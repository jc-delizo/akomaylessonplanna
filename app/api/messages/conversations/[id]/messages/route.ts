import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { autoFlagMessage, flagMessage } from '@/lib/messaging/moderation-utils'
import { createMessageNotification } from '@/lib/messaging/notification-integration'

/**
 * GET /api/messages/conversations/[id]/messages
 * Get all messages in conversation
 * Query params: before (timestamp), limit (default: 50, max: 100)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const before = searchParams.get('before') // timestamp
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    // Verify user is participant
    const { data: conversation } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .single()

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    if (
      conversation.buyer_id !== user.id &&
      conversation.seller_id !== user.id
    ) {
      // Check if admin
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (userData?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Forbidden' },
          { status: 403 }
        )
      }
    }

    // Build query
    let query = supabase
      .from('messages')
      .select(
        `
        *,
        sender:sender_id(id, name, username, avatar_url, is_verified_teacher)
      `
      )
      .eq('conversation_id', conversationId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply before filter if provided
    if (before) {
      query = query.lt('created_at', before)
    }

    const { data: messages, error } = await query

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    // Reverse to chronological order (oldest first)
    const sortedMessages = (messages || []).reverse()

    return NextResponse.json({ messages: sortedMessages })
  } catch (error) {
    console.error('Error in GET /api/messages/conversations/[id]/messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messages/conversations/[id]/messages
 * Send new message
 * Body: { content, attachments[] (optional) }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await request.json()
    const { content, attachments } = body

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    if (content.length > 1000) {
      return NextResponse.json(
        { error: 'Message content exceeds 1000 characters' },
        { status: 400 }
      )
    }

    // Validate attachments (max 3, images only)
    if (attachments && Array.isArray(attachments)) {
      if (attachments.length > 3) {
        return NextResponse.json(
          { error: 'Maximum 3 attachments allowed' },
          { status: 400 }
        )
      }
    }

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id, status, blocked_by')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check if user is participant
    if (
      conversation.buyer_id !== user.id &&
      conversation.seller_id !== user.id
    ) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Check if conversation is blocked
    if (conversation.status === 'blocked') {
      return NextResponse.json(
        { error: 'Conversation is blocked' },
        { status: 403 }
      )
    }

    // Check if user is blocked
    const otherUserId =
      conversation.buyer_id === user.id
        ? conversation.seller_id
        : conversation.buyer_id

    const { data: block } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', otherUserId)
      .eq('blocked_id', user.id)
      .single()

    if (block) {
      return NextResponse.json(
        { error: 'You are blocked by this user' },
        { status: 403 }
      )
    }

    // Check rate limiting (max 10 messages per hour per conversation)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { count: recentMessages } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('conversation_id', conversationId)
      .eq('sender_id', user.id)
      .gte('created_at', oneHourAgo)

    if (recentMessages && recentMessages >= 10) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please wait before sending more messages.' },
        { status: 429 }
      )
    }

    // Auto-flag message if needed (but still deliver)
    const flagReason = await autoFlagMessage(
      conversationId,
      user.id,
      content.trim()
    )

    // Create message
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        message_type: 'user',
        attachments: attachments || [],
        is_read: false,
        is_flagged: flagReason !== null,
        flag_reason: flagReason || null,
      })
      .select(
        `
        *,
        sender:sender_id(id, name, username, avatar_url, is_verified_teacher)
      `
      )
      .single()

    if (msgError) {
      console.error('Error creating message:', msgError)
      return NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      )
    }

    // Flag message if needed (already set in insert, but ensure it's flagged)
    if (flagReason && message) {
      await flagMessage(message.id, flagReason)
    }

    // Create notification for recipient
    if (message) {
      // Get recipient ID (the other participant)
      const recipientId =
        conversation.buyer_id === user.id
          ? conversation.seller_id
          : conversation.buyer_id

      await createMessageNotification(
        conversationId,
        message.id,
        user.id,
        recipientId
      )
    }

    // Update conversation status if archived (unarchive it)
    if (conversation.status === 'archived') {
      await supabase
        .from('conversations')
        .update({
          status: 'active',
          archived_by: null,
        })
        .eq('id', conversationId)
    }

    return NextResponse.json({ message }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/messages/conversations/[id]/messages:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
