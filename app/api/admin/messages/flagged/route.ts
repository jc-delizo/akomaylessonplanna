import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/messages/flagged
 * Get flagged messages queue
 * Query params: status (pending, resolved, all)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const tableName = 'messages'

    // Build query
    let query = supabase
      .from(tableName)
      .select(
        `
        *,
        sender:sender_id(id, name, username, email),
        conversation:conversation_id(
          id,
          buyer_id,
          seller_id,
          product_id,
          buyer:buyer_id(id, name, username),
          seller:seller_id(id, name, username),
          product:product_id(id, title)
        )
      `
      )
      .eq('is_flagged', true)
      .order('created_at', { ascending: false })

    // Note: status filter would be on reports, not messages
    // For now, we show all flagged messages

    const { data: messages, error } = await query.limit(100)

    if (error) {
      console.error('Error fetching flagged messages:', error)
      return NextResponse.json(
        { error: 'Failed to fetch flagged messages' },
        { status: 500 }
      )
    }

    return NextResponse.json({ messages: messages || [] })
  } catch (error) {
    console.error('Error in GET /api/admin/messages/flagged:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
