import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/messages/conversations/[id]/unblock
 * Unblock user
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
      .select('buyer_id, seller_id, blocked_by')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Check if user is the one who blocked
    if (conversation.blocked_by !== user.id) {
      return NextResponse.json(
        { error: 'Only the user who blocked can unblock' },
        { status: 403 }
      )
    }

    // Get the other user ID
    const otherUserId =
      conversation.buyer_id === user.id
        ? conversation.seller_id
        : conversation.buyer_id

    // Delete block
    const { error: deleteError } = await supabase
      .from('user_blocks')
      .delete()
      .eq('blocker_id', user.id)
      .eq('blocked_id', otherUserId)

    if (deleteError) {
      console.error('Error deleting block:', deleteError)
      return NextResponse.json(
        { error: 'Failed to unblock user' },
        { status: 500 }
      )
    }

    // Update conversation status back to active
    const { data: updated, error: updateError } = await supabase
      .from('conversations')
      .update({
        status: 'active',
        blocked_by: null,
      })
      .eq('id', conversationId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating conversation:', updateError)
      // Don't fail - block is deleted
    }

    return NextResponse.json({
      success: true,
      conversation: updated,
    })
  } catch (error) {
    console.error('Error in POST /api/messages/conversations/[id]/unblock:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
