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

    // Verify user is a seller
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

    // Get all completed order items for this seller
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('net_earnings, created_at, order:orders!order_items_order_id_fkey(payment_status, completed_at)')
      .eq('seller_id', user.id)

    if (itemsError) {
      console.error('Error fetching order items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
    }

    // Calculate earnings
    const now = new Date()
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    let availableBalance = 0
    let pendingBalance = 0
    let totalEarnings = 0
    let thisWeek = 0
    let thisMonth = 0
    let allTime = 0

    for (const item of orderItems || []) {
      if (item.order?.payment_status === 'completed') {
        const earnings = parseFloat(item.net_earnings.toString())
        allTime += earnings

        const itemDate = new Date(item.order.completed_at || item.created_at)
        if (itemDate >= weekAgo) {
          thisWeek += earnings
        }
        if (itemDate >= monthAgo) {
          thisMonth += earnings
        }

        // Available balance: completed orders older than 3 days
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
        if (itemDate < threeDaysAgo) {
          availableBalance += earnings
        } else {
          pendingBalance += earnings
        }
      }
    }

    // Subtract withdrawn amounts
    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('amount, status')
      .eq('seller_id', user.id)
      .in('status', ['processing', 'completed'])

    if (withdrawals) {
      const withdrawnAmount = withdrawals
        .filter((w) => w.status === 'completed')
        .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0)

      availableBalance = Math.max(0, availableBalance - withdrawnAmount)
    }

    const response: any = {
      available_balance: availableBalance,
      pending_balance: pendingBalance,
      total_earnings: allTime,
      this_week: thisWeek,
      this_month: thisMonth,
      all_time: allTime,
    }

    // Add Pro/Pioneer chart data
    if (isProOrPioneer) {
      // Revenue by Month (last 6 months)
      const revenueByMonth: Array<{ month: string; revenue: number }> = []
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

        const monthEarnings =
          orderItems
            ?.filter(
              (item) =>
                item.order?.payment_status === 'completed' &&
                new Date(item.order.completed_at || item.created_at) >= monthDate &&
                new Date(item.order.completed_at || item.created_at) <= monthEnd
            )
            .reduce(
              (sum, item) => sum + parseFloat(item.net_earnings.toString()),
              0
            ) || 0

        revenueByMonth.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthEarnings,
        })
      }

      // Sales by Category (from products)
      const { data: sellerProducts } = await supabase
        .from('products')
        .select('id, product_type')
        .eq('seller_id', user.id)

      const categorySales: Record<string, number> = {}
      orderItems
        ?.filter((item) => item.order?.payment_status === 'completed')
        .forEach((item) => {
          const product = sellerProducts?.find((p) => p.id === item.product_id)
          if (product) {
            const category = product.product_type
            categorySales[category] =
              (categorySales[category] || 0) + parseFloat(item.net_earnings.toString())
          }
        })

      // Earnings Trend (last 30 days)
      const earningsTrend: Array<{ date: string; earnings: number }> = []
      for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]

        const dayEarnings =
          orderItems
            ?.filter(
              (item) =>
                item.order?.payment_status === 'completed' &&
                (item.order.completed_at || item.created_at).startsWith(dateStr)
            )
            .reduce(
              (sum, item) => sum + parseFloat(item.net_earnings.toString()),
              0
            ) || 0

        earningsTrend.push({
          date: dateStr,
          earnings: dayEarnings,
        })
      }

      // Projected earnings for current month
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const daysPassed = now.getDate()
      const currentMonthEarnings =
        orderItems
          ?.filter(
            (item) =>
              item.order?.payment_status === 'completed' &&
              new Date(item.order.completed_at || item.created_at) >= currentMonthStart
          )
          .reduce(
            (sum, item) => sum + parseFloat(item.net_earnings.toString()),
            0
          ) || 0

      const projectedEarnings = (currentMonthEarnings / daysPassed) * daysInMonth

      // Last month earnings for comparison
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
          .reduce(
            (sum, item) => sum + parseFloat(item.net_earnings.toString()),
            0
          ) || 0

      const projectedGrowth =
        lastMonthEarnings > 0
          ? ((projectedEarnings - lastMonthEarnings) / lastMonthEarnings) * 100
          : projectedEarnings > 0
          ? 100
          : 0

      response.charts = {
        revenueByMonth,
        salesByCategory: Object.entries(categorySales).map(([category, revenue]) => ({
          category,
          revenue,
        })),
        earningsTrend,
      }
      response.projected = {
        amount: projectedEarnings,
        growth: projectedGrowth,
        lastMonth: lastMonthEarnings,
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/seller/earnings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
