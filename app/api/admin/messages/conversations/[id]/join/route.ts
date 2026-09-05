import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * POST /api/admin/messages/conversations/[id]/join
 * Admin joins conversation as mediator
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { id: conversationId } = await params
    const supabase = createAdminClient()

    // Get conversation
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('id, admin_joined')
      .eq('id', conversationId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Mark admin as joined (update any message to indicate admin joined)
    // We'll use a system message to indicate admin joined
    const { error: msgError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: authResult.admin.userId,
      content: 'Admin has joined this conversation to help resolve the issue.',
      message_type: 'admin',
      admin_joined: true,
      admin_id: authResult.admin.userId,
    })

    if (msgError) {
      console.error('Error creating admin join message:', msgError)
      return NextResponse.json(
        { error: 'Failed to join conversation' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/admin/messages/conversations/[id]/join:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
