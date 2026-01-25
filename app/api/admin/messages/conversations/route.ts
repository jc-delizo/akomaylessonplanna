import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/messages/conversations
 * Get all conversations (admin view)
 * Query params: user_id, product_id, status, flagged, page, per_page
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const productId = searchParams.get('product_id')
    const status = searchParams.get('status')
    const flagged = searchParams.get('flagged') === 'true'
    const page = parseInt(searchParams.get('page') || '1')
    const perPage = parseInt(searchParams.get('per_page') || '20')
    const offset = (page - 1) * perPage

    // Build query
    let query = supabase
      .from('conversations')
      .select(
        `
        *,
        buyer:buyer_id(id, first_name, last_name, username, email),
        seller:seller_id(id, first_name, last_name, username, email),
        product:product_id(id, title, price)
      `,
        { count: 'exact' }
      )
      .order('last_message_at', { ascending: false })

    // Apply filters
    if (userId) {
      query = query.or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    }
    if (productId) {
      query = query.eq('product_id', productId)
    }
    if (status) {
      query = query.eq('status', status)
    }

    // Get conversations with pagination
    const { data: conversations, error, count } = await query
      .range(offset, offset + perPage - 1)

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    // If flagged filter, get conversations with flagged messages
    let filteredConversations = conversations || []
    if (flagged) {
      const conversationIds = filteredConversations.map((c) => c.id)
      const { data: flaggedMessages } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .eq('is_flagged', true)

      const flaggedConvIds = new Set(
        flaggedMessages?.map((m) => m.conversation_id) || []
      )
      filteredConversations = filteredConversations.filter((c) =>
        flaggedConvIds.has(c.id)
      )
    }

    return NextResponse.json({
      conversations: filteredConversations,
      pagination: {
        page,
        per_page: perPage,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / perPage),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/messages/conversations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
