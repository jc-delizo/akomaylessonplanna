import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/messages/conversations/[id]/archive
 * Archive conversation
 */
export async function PUT(
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

    // Get conversation to verify ownership
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

    // Archive conversation
    const { data: updated, error: updateError } = await supabase
      .from('conversations')
      .update({
        status: 'archived',
        archived_by: user.id,
      })
      .eq('id', conversationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error archiving conversation:', updateError)
      return NextResponse.json(
        { error: 'Failed to archive conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversation: updated })
  } catch (error) {
    console.error('Error in PUT /api/messages/conversations/[id]/archive:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
