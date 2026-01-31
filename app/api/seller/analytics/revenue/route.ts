import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getRelation } from '@/lib/utils/supabase-relations'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is Pro/Pioneer seller
    const { data: userData } = await supabase
      .from('users')
      .select('role, can_sell, subscription_tier')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isProOrPioneer =
      userData.subscription_tier === 'pro' || userData.subscription_tier === 'pioneer'

    if (!isProOrPioneer) {
      return NextResponse.json({ error: 'Pro/Pioneer subscription required' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const timePeriod = searchParams.get('time_period') || '30'
    const groupBy = searchParams.get('group_by') || 'day' // day, week, month

    const days = parseInt(timePeriod)
    const now = new Date()
    const dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    // Get order items
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('net_earnings, created_at, order:orders!order_items_order_id_fkey(payment_status, completed_at)')
      .eq('seller_id', user.id)
      .gte('created_at', dateFrom.toISOString())

    // Group by time period
    const dataPoints: Array<{ period: string; revenue: number; previousRevenue: number }> = []

    if (groupBy === 'day') {
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]

        const dayRevenue =
          orderItems
            ?.filter(
              (item) => {
                const order = getRelation(item.order)
                return order?.payment_status === 'completed' &&
                  (order.completed_at || item.created_at).startsWith(dateStr)
              }
            )
            .reduce((sum, item) => sum + parseFloat(item.net_earnings.toString()), 0) || 0

        // Previous period (same day last week/month)
        const previousDate = new Date(date.getTime() - days * 24 * 60 * 60 * 1000)
        const previousDateStr = previousDate.toISOString().split('T')[0]
        const previousRevenue =
          orderItems
            ?.filter(
              (item) => {
                const order = getRelation(item.order)
                return order?.payment_status === 'completed' &&
                  (order.completed_at || item.created_at).startsWith(previousDateStr)
              }
            )
            .reduce((sum, item) => sum + parseFloat(item.net_earnings.toString()), 0) || 0

        dataPoints.push({
          period: dateStr,
          revenue: dayRevenue,
          previousRevenue,
        })
      }
    } else if (groupBy === 'week') {
      // Group by week
      const weeks: Record<string, number> = {}
      orderItems
        ?.filter((item) => {
          const order = getRelation(item.order)
          return order?.payment_status === 'completed'
        })
        .forEach((item) => {
          const order = getRelation(item.order)
          const date = new Date(order?.completed_at || item.created_at)
          const weekStart = new Date(date)
          weekStart.setDate(date.getDate() - date.getDay())
          const weekKey = weekStart.toISOString().split('T')[0]

          weeks[weekKey] =
            (weeks[weekKey] || 0) + parseFloat(item.net_earnings.toString())
        })

      dataPoints.push(
        ...Object.entries(weeks).map(([period, revenue]) => ({
          period,
          revenue,
          previousRevenue: 0, // Simplified
        }))
      )
    } else if (groupBy === 'month') {
      // Group by month
      const months: Record<string, number> = {}
      orderItems
        ?.filter((item) => {
          const order = getRelation(item.order)
          return order?.payment_status === 'completed'
        })
        .forEach((item) => {
          const order = getRelation(item.order)
          const date = new Date(order?.completed_at || item.created_at)
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

          months[monthKey] =
            (months[monthKey] || 0) + parseFloat(item.net_earnings.toString())
        })

      dataPoints.push(
        ...Object.entries(months).map(([period, revenue]) => ({
          period,
          revenue,
          previousRevenue: 0, // Simplified
        }))
      )
    }

    // Calculate comparison
    const currentTotal = dataPoints.reduce((sum, p) => sum + p.revenue, 0)
    const previousTotal = dataPoints.reduce((sum, p) => sum + p.previousRevenue, 0)
    const trend =
      previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : currentTotal > 0 ? 100 : 0

    return NextResponse.json({
      dataPoints: dataPoints.sort((a, b) => a.period.localeCompare(b.period)),
      currentTotal,
      previousTotal,
      trend,
      timePeriod,
      groupBy,
    })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/revenue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
