import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

/**
 * GET /api/messages/unread-count
 * Returns { unread_count: number } for Messages icon badge (navbar, seller sidebar).
 * Counts messages where recipient = current user and is_read = false.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ unread_count: 0 })
    }

    // Get conversation IDs where current user is participant
    const { data: convs } = await supabase
      .from('conversations')
      .select('id')
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)

    const convIds = convs?.map((c) => c.id) ?? []
    if (convIds.length === 0) {
      return NextResponse.json({ unread_count: 0 })
    }

    const { count, error } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .in('conversation_id', convIds)
      .eq('is_read', false)
      .neq('sender_id', user.id)

    if (error) {
      console.error('Error fetching unread count:', error)
      return NextResponse.json({ unread_count: 0 })
    }

    return NextResponse.json({ unread_count: count ?? 0 })
  } catch (error) {
    console.error('Error in GET /api/messages/unread-count:', error)
    return NextResponse.json({ unread_count: 0 })
  }
}
