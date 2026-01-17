import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a seller with Pro/Pioneer subscription
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

    // Get order items for current and last month
    const now = new Date()
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
    const daysPassed = now.getDate()

    const { data: orderItems } = await supabase
      .from('order_items')
      .select('net_earnings, created_at, order:orders!order_items_order_id_fkey(payment_status, completed_at)')
      .eq('seller_id', user.id)

    // Current month earnings
    const currentMonthEarnings =
      orderItems
        ?.filter(
          (item) =>
            item.order?.payment_status === 'completed' &&
            new Date(item.order.completed_at || item.created_at) >= currentMonthStart
        )
        .reduce((sum, item) => sum + parseFloat(item.net_earnings.toString()), 0) || 0

    // Projected earnings
    const projectedEarnings = (currentMonthEarnings / daysPassed) * daysInMonth

    // Last month earnings
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const lastMonthEarnings =
      orderItems
        ?.filter(
          (item) =>
            item.order?.payment_status === 'completed' &&
            new Date(item.order.completed_at || item.created_at) >= lastMonthStart &&
            new Date(item.order.completed_at || item.created_at) <= lastMonthEnd
        )
        .reduce((sum, item) => sum + parseFloat(item.net_earnings.toString()), 0) || 0

    const projectedGrowth =
      lastMonthEarnings > 0
        ? ((projectedEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
        : projectedEarnings > 0
        ? 100
        : 0

    return NextResponse.json({
      projected: projectedEarnings,
      current: currentMonthEarnings,
      lastMonth: lastMonthEarnings,
      growth: projectedGrowth,
      pace: currentMonthEarnings / daysPassed, // Daily average
    })
  } catch (error) {
    console.error('Error in GET /api/seller/earnings/projected:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
