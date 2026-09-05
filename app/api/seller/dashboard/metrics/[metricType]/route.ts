import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { parseBoundedInteger } from '@/lib/utils/query-params'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ metricType: string }> }
) {
  try {
    const { metricType } = await params
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
      .select('role, can_sell')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const timePeriod = searchParams.get('time_period') || 'month'
    const days = parseBoundedInteger(searchParams.get('days'), 30, 1, 365)

    // Calculate date range
    const now = new Date()
    const dateFrom = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)

    let dataPoints: Array<{ date: string; value: number }> = []

    switch (metricType) {
      case 'revenue':
        const { data: revenueItems } = await supabase
          .from('order_items')
          .select('net_earnings, created_at, order:orders!order_items_order_id_fkey(payment_status)')
          .eq('seller_id', user.id)
          .gte('created_at', dateFrom.toISOString())

        // Group by day
        const revenueByDay: Record<string, number> = {}
        revenueItems
          ?.filter((item) => {
            const order = Array.isArray(item.order) ? item.order[0] : item.order
            return order?.payment_status === 'completed'
          })
          .forEach((item) => {
            const date = item.created_at.split('T')[0]
            revenueByDay[date] =
              (revenueByDay[date] || 0) + parseFloat(item.net_earnings.toString())
          })

        dataPoints = Object.entries(revenueByDay).map(([date, value]) => ({
          date,
          value,
        }))
        break

      case 'sales':
        const { data: salesItems } = await supabase
          .from('order_items')
          .select('created_at, order:orders!order_items_order_id_fkey(payment_status)')
          .eq('seller_id', user.id)
          .gte('created_at', dateFrom.toISOString())

        const salesByDay: Record<string, number> = {}
        salesItems
          ?.filter((item) => {
            const order = Array.isArray(item.order) ? item.order[0] : item.order
            return order?.payment_status === 'completed'
          })
          .forEach((item) => {
            const date = item.created_at.split('T')[0]
            salesByDay[date] = (salesByDay[date] || 0) + 1
          })

        dataPoints = Object.entries(salesByDay).map(([date, value]) => ({
          date,
          value,
        }))
        break

      case 'views':
        // Get product views over time (simplified - using product_views table if exists)
        const { data: products } = await supabase
          .from('products')
          .select('views_count, created_at')
          .eq('seller_id', user.id)
          .gte('created_at', dateFrom.toISOString())

        // Simplified: distribute views evenly across days since creation
        // In production, use product_views table with viewed_at timestamp
        dataPoints = []
        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
          const dateStr = date.toISOString().split('T')[0]

          const dayViews =
            products?.filter((p) => {
              const productDate = new Date(p.created_at).toISOString().split('T')[0]
              return productDate <= dateStr
            }).reduce((sum, p) => sum + (p.views_count || 0), 0) || 0

          dataPoints.push({ date: dateStr, value: dayViews })
        }
        break

      default:
        return NextResponse.json(
          { error: 'Invalid metric type' },
          { status: 400 }
        )
    }

    // Sort by date
    dataPoints.sort((a, b) => a.date.localeCompare(b.date))

    // Calculate current value and trend
    const currentValue = dataPoints[dataPoints.length - 1]?.value || 0
    const previousValue = dataPoints[dataPoints.length - 2]?.value || 0
    const trend =
      previousValue > 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : currentValue > 0
        ? 100
        : 0

    return NextResponse.json({
      metricType,
      currentValue,
      trend,
      dataPoints,
      timePeriod,
    })
  } catch (error) {
    console.error('Error in GET /api/seller/dashboard/metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
