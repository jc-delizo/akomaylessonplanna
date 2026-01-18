import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/seller/messages/analytics
 * Get seller messaging analytics
 * Response: { total_conversations, active_conversations, unread_count, response_time_avg, response_time_badge, message_count_today, message_count_month }
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a seller
    const { data: userData } = await supabase
      .from('users')
      .select('can_sell')
      .eq('id', user.id)
      .single()

    if (!userData?.can_sell) {
      return NextResponse.json(
        { error: 'Only sellers can access messaging analytics' },
        { status: 403 }
      )
    }

    // Get total conversations
    const { count: totalConversations } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)

    // Get active conversations
    const { count: activeConversations } = await supabase
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('seller_id', user.id)
      .eq('status', 'active')

    // Get seller conversation IDs first
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .eq('seller_id', user.id)
    
    const conversationIds = conversations?.map(c => c.id) || []
    
    // Get unread count
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('is_read', false)
      .neq('sender_id', user.id)
      .in('conversation_id', conversationIds)

    // Get response time average (last 50 responses, rolling 30-day window)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: responseTimes } = await supabase
      .from('seller_response_times')
      .select('response_seconds')
      .eq('seller_id', user.id)
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(50)

    const responseTimeAvg =
      responseTimes && responseTimes.length > 0
        ? Math.round(
            responseTimes.reduce((sum, rt) => sum + rt.response_seconds, 0) /
              responseTimes.length
          )
        : null

    // Calculate response time badge
    let responseTimeBadge = null
    if (responseTimeAvg !== null) {
      const hours = responseTimeAvg / 3600
      if (hours < 1) {
        responseTimeBadge = { text: '⚡ Lightning fast', range: '< 1 hour' }
      } else if (hours < 3) {
        responseTimeBadge = { text: '🚀 Very responsive', range: '< 3 hours' }
      } else if (hours < 6) {
        responseTimeBadge = { text: '✅ Responsive', range: '< 6 hours' }
      } else if (hours < 12) {
        responseTimeBadge = { text: 'Moderate', range: '< 12 hours' }
      } else if (hours < 24) {
        responseTimeBadge = { text: 'Slow', range: '< 24 hours' }
      } else {
        responseTimeBadge = { text: 'Very slow', range: '> 24 hours' }
      }
    }

    // Get message counts
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

    const { count: messageCountToday } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', today.toISOString())

    const { count: messageCountMonth } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('sender_id', user.id)
      .gte('created_at', monthStart.toISOString())

    return NextResponse.json({
      total_conversations: totalConversations || 0,
      active_conversations: activeConversations || 0,
      unread_count: unreadCount || 0,
      response_time_avg: responseTimeAvg,
      response_time_badge: responseTimeBadge,
      message_count_today: messageCountToday || 0,
      message_count_month: messageCountMonth || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/seller/messages/analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
