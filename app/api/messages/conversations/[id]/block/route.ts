import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/messages/conversations/[id]/block
 * Block other participant in conversation
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

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id, status')
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

    // Get the other user ID
    const otherUserId =
      conversation.buyer_id === user.id
        ? conversation.seller_id
        : conversation.buyer_id

    // Check if already blocked
    const { data: existingBlock } = await supabase
      .from('user_blocks')
      .select('id')
      .eq('blocker_id', user.id)
      .eq('blocked_id', otherUserId)
      .single()

    if (existingBlock) {
      return NextResponse.json(
        { error: 'User is already blocked' },
        { status: 400 }
      )
    }

    // Create block
    const { error: blockError } = await supabase
      .from('user_blocks')
      .insert({
        blocker_id: user.id,
        blocked_id: otherUserId,
        conversation_id: conversationId,
      })

    if (blockError) {
      console.error('Error creating block:', blockError)
      return NextResponse.json(
        { error: 'Failed to block user' },
        { status: 500 }
      )
    }

    // Update conversation status to blocked
    const { data: updated, error: updateError } = await supabase
      .from('conversations')
      .update({
        status: 'blocked',
        blocked_by: user.id,
      })
      .eq('id', conversationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating conversation:', updateError)
      // Don't fail - block is created
    }

    return NextResponse.json({
      success: true,
      conversation: updated,
    })
  } catch (error) {
    console.error('Error in POST /api/messages/conversations/[id]/block:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
