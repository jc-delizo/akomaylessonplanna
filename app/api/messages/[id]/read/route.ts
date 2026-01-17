import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/messages/[id]/read
 * Mark message as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: messageId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get message to verify recipient
    const { data: message, error: msgError } = await supabase
      .from('messages')
      .select('conversation_id, sender_id')
      .eq('id', messageId)
      .single()

    if (msgError || !message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      )
    }

    // Check if user is recipient (not sender)
    if (message.sender_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot mark own message as read' },
        { status: 400 }
      )
    }

    // Verify user is participant in conversation
    const { data: conversation } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', message.conversation_id)
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
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    // Mark as read
    const { data: updated, error: updateError } = await supabase
      .from('messages')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .select()
      .single()

    if (updateError) {
      console.error('Error marking message as read:', updateError)
      return NextResponse.json(
        { error: 'Failed to mark message as read' },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: updated })
  } catch (error) {
    console.error('Error in PUT /api/messages/[id]/read:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
