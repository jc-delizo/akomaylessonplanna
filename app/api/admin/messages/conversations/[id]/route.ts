import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/messages/conversations/[id]
 * View any conversation (admin access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { id: conversationId } = await params
    const supabase = await createClient()

    // Get conversation with full details
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select(
        `
        *,
        buyer:buyer_id(id, first_name, last_name, username, email, avatar_url),
        seller:seller_id(id, first_name, last_name, username, email, avatar_url),
        product:product_id(id, title, price, cover_image_url, slug)
      `
      )
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Get all messages (including deleted ones for admin)
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:sender_id(id, name, username, avatar_url, email)
      `
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (messagesError) {
      console.error('Error fetching messages:', messagesError)
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      conversation,
      messages: messages || [],
    })
  } catch (error) {
    console.error('Error in GET /api/admin/messages/conversations/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
