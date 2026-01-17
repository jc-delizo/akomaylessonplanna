import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/email/analytics
 * Get email analytics dashboard data
 * Query params: ?start_date=2026-01-01&end_date=2026-01-13
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    const endDate = searchParams.get('end_date') || new Date().toISOString().split('T')[0]

    // Get overall stats
    const { count: totalSent } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      .gte('sent_at', `${startDate}T00:00:00`)
      .lte('sent_at', `${endDate}T23:59:59`)

    const { count: totalDelivered } = await supabase
      .from('email_analytics')
      .select('*', { count: 'exact', head: true })
      .not('delivered_at', 'is', null)
      .gte('sent_at', `${startDate}T00:00:00`)
      .lte('sent_at', `${endDate}T23:59:59`)

    const { count: totalOpened } = await supabase
      .from('email_analytics')
      .select('*', { count: 'exact', head: true })
      .not('opened_at', 'is', null)
      .gte('sent_at', `${startDate}T00:00:00`)
      .lte('sent_at', `${endDate}T23:59:59`)

    const { count: totalClicked } = await supabase
      .from('email_analytics')
      .select('*', { count: 'exact', head: true })
      .not('clicked_at', 'is', null)
      .gte('sent_at', `${startDate}T00:00:00`)
      .lte('sent_at', `${endDate}T23:59:59`)

    const { count: totalBounced } = await supabase
      .from('email_analytics')
      .select('*', { count: 'exact', head: true })
      .eq('bounced', true)
      .gte('sent_at', `${startDate}T00:00:00`)
      .lte('sent_at', `${endDate}T23:59:59`)

    const { count: totalFailed } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`)

    // Calculate rates
    const deliveryRate = totalSent && totalSent > 0
      ? ((totalDelivered || 0) / totalSent) * 100
      : 0
    const openRate = totalDelivered && totalDelivered > 0
      ? ((totalOpened || 0) / totalDelivered) * 100
      : 0
    const clickRate = totalOpened && totalOpened > 0
      ? ((totalClicked || 0) / totalOpened) * 100
      : 0
    const bounceRate = totalSent && totalSent > 0
      ? ((totalBounced || 0) / totalSent) * 100
      : 0

    // Get queue status
    const { count: pendingCount } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    const { count: processingCount } = await supabase
      .from('email_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'processing')

    return NextResponse.json({
      metrics: {
        sent: totalSent || 0,
        delivered: totalDelivered || 0,
        opened: totalOpened || 0,
        clicked: totalClicked || 0,
        bounced: totalBounced || 0,
        failed: totalFailed || 0,
        delivery_rate: Math.round(deliveryRate * 100) / 100,
        open_rate: Math.round(openRate * 100) / 100,
        click_rate: Math.round(clickRate * 100) / 100,
        bounce_rate: Math.round(bounceRate * 100) / 100,
      },
      queue: {
        pending: pendingCount || 0,
        processing: processingCount || 0,
      },
      date_range: {
        start_date: startDate,
        end_date: endDate,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/admin/email/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
