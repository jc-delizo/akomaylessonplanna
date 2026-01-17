import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/admin/email/analytics/by-type
 * Get performance metrics by email type
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

    // Get stats grouped by email type
    const { data: analytics, error } = await supabase
      .from('email_analytics')
      .select('email_type, sent_at, delivered_at, opened_at, clicked_at, bounced')
      .gte('sent_at', `${startDate}T00:00:00`)
      .lte('sent_at', `${endDate}T23:59:59`)

    if (error) {
      console.error('Error fetching analytics by type:', error)
      return NextResponse.json(
        { error: 'Failed to fetch analytics' },
        { status: 500 }
      )
    }

    // Group and calculate metrics by type
    const typeStats = (analytics || []).reduce((acc: any, item: any) => {
      const type = item.email_type
      if (!acc[type]) {
        acc[type] = {
          email_type: type,
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          bounced: 0,
        }
      }

      acc[type].sent++
      if (item.delivered_at) acc[type].delivered++
      if (item.opened_at) acc[type].opened++
      if (item.clicked_at) acc[type].clicked++
      if (item.bounced) acc[type].bounced++

      return acc
    }, {})

    // Calculate rates for each type
    const result = Object.values(typeStats).map((stats: any) => ({
      ...stats,
      delivery_rate: stats.sent > 0 ? Math.round((stats.delivered / stats.sent) * 10000) / 100 : 0,
      open_rate: stats.delivered > 0 ? Math.round((stats.opened / stats.delivered) * 10000) / 100 : 0,
      click_rate: stats.opened > 0 ? Math.round((stats.clicked / stats.opened) * 10000) / 100 : 0,
      bounce_rate: stats.sent > 0 ? Math.round((stats.bounced / stats.sent) * 10000) / 100 : 0,
    }))

    return NextResponse.json({ by_type: result })
  } catch (error) {
    console.error('Error in GET /api/admin/email/analytics/by-type:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
