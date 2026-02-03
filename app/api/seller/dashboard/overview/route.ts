import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getRelation } from '@/lib/utils/supabase-relations'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/seller/dashboard/overview/route.ts:GET',message:'getUser result',data:{hasUser:!!user,userId:user?.id?.slice(0,8)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a seller
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role, can_sell, subscription_tier')
      .eq('id', user.id)
      .single()

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/seller/dashboard/overview/route.ts:userData',message:'users select result',data:{userDataError:userDataError?.message??null,role:userData?.role,can_sell:userData?.can_sell,hasUserData:!!userData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,E'})}).catch(()=>{});
    // #endregion

    const allowed =
      userData &&
      (userData.role === 'admin' ||
        (userData.role === 'seller' && userData.can_sell))
    if (!allowed) {
      // #region agent log
      const reason = !userData ? 'noUserData' : userData.role !== 'seller' ? 'roleNotSeller' : 'can_sellFalse';
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/seller/dashboard/overview/route.ts:403',message:'403 reason',data:{reason,role:userData?.role,can_sell:userData?.can_sell},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C,E'})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const timePeriod = searchParams.get('time_period') || 'month' // today, week, month, all

    // Cache read removed: single-metric cache returned wrong sales/views/rating. Always compute full metrics.

    // Calculate date range
    const now = new Date()
    let dateFrom: Date | null = null

    switch (timePeriod) {
      case 'today':
        dateFrom = new Date(now)
        dateFrom.setHours(0, 0, 0, 0)
        break
      case 'week':
        dateFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        dateFrom = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        break
      case 'all':
        dateFrom = null
        break
    }

    // Get revenue (from completed orders)
    const revenueQuery = supabase
      .from('order_items')
      .select('net_earnings, created_at, order:orders!order_items_order_id_fkey(payment_status, completed_at)')
      .eq('seller_id', user.id)

    if (dateFrom) {
      revenueQuery.gte('created_at', dateFrom.toISOString())
    }

    const { data: orderItems, error: orderItemsError } = await revenueQuery

    let revenue = 0
    let previousRevenue = 0
    let previousSalesCount = 0
    const currentPeriodItems = orderItems?.filter(
      (item) => {
        const order = getRelation(item.order)
        return order?.payment_status === 'completed'
      }
    ) || []
    const salesCount = currentPeriodItems.length
    revenue = currentPeriodItems.reduce(
      (sum, item) => sum + parseFloat(item.net_earnings.toString()),
      0
    )

    // Calculate previous period for revenue and sales trend
    if (dateFrom) {
      const periodDuration = now.getTime() - dateFrom.getTime()
      const previousPeriodStart = new Date(dateFrom.getTime() - periodDuration)

      const { data: previousItems } = await supabase
        .from('order_items')
        .select('net_earnings, order:orders!order_items_order_id_fkey(payment_status)')
        .eq('seller_id', user.id)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', dateFrom.toISOString())

      const previousCompleted = previousItems?.filter((item) => {
        const order = getRelation(item.order)
        return order?.payment_status === 'completed'
      }) || []
      previousRevenue = previousCompleted.reduce(
        (sum, item) => sum + parseFloat(item.net_earnings.toString()),
        0
      )
      previousSalesCount = previousCompleted.length
    }

    // Get products for total views and seller product IDs (for product_views trend)
    const { data: products } = await supabase
      .from('products')
      .select('id, views_count')
      .eq('seller_id', user.id)

    const totalViews = products?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0
    const sellerProductIds = products?.map((p) => p.id) || []

    // Views trend from product_views table (current vs previous period counts)
    let currentPeriodViewCount = 0
    let previousPeriodViewCount = 0
    if (sellerProductIds.length > 0) {
      const viewPeriodFrom = dateFrom
      const viewPeriodTo = now
      if (viewPeriodFrom) {
        const periodDuration = viewPeriodTo.getTime() - viewPeriodFrom.getTime()
        const viewPreviousStart = new Date(viewPeriodFrom.getTime() - periodDuration)
        const { count: currentCount } = await supabase
          .from('product_views')
          .select('*', { count: 'exact', head: true })
          .in('product_id', sellerProductIds)
          .gte('viewed_at', viewPeriodFrom.toISOString())
          .lte('viewed_at', viewPeriodTo.toISOString())
        const { count: prevCount } = await supabase
          .from('product_views')
          .select('*', { count: 'exact', head: true })
          .in('product_id', sellerProductIds)
          .gte('viewed_at', viewPreviousStart.toISOString())
          .lt('viewed_at', viewPeriodFrom.toISOString())
        currentPeriodViewCount = currentCount ?? 0
        previousPeriodViewCount = prevCount ?? 0
      }
    }
    const previousViews = previousPeriodViewCount

    // Get average rating - fix: filter reviews by seller_id after fetching
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating, product:products!reviews_product_id_fkey(seller_id)')

    const sellerReviews = reviews?.filter(
      (r) => {
        const product = getRelation(r.product)
        return product?.seller_id === user.id
      }
    ) || []
    const avgRating =
      sellerReviews.length > 0
        ? sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length
        : 0

    // Calculate trends (percentage change)
    const revenueTrend =
      previousRevenue > 0
        ? ((revenue - previousRevenue) / previousRevenue) * 100
        : revenue > 0
        ? 100
        : 0
    const salesTrend =
      previousSalesCount > 0
        ? ((salesCount - previousSalesCount) / previousSalesCount) * 100
        : salesCount > 0
        ? 100
        : 0
    const viewsTrend =
      previousPeriodViewCount > 0
        ? ((currentPeriodViewCount - previousPeriodViewCount) / previousPeriodViewCount) * 100
        : currentPeriodViewCount > 0
        ? 100
        : 0

    // Get chart data (last 7 days for Free, more for Pro/Pioneer)
    const chartDays = userData.subscription_tier === 'free' ? 7 : 30
    const chartStart = new Date(now.getTime() - chartDays * 24 * 60 * 60 * 1000)

    const { data: chartOrderItems, error: chartOrderItemsError } = await supabase
      .from('order_items')
      .select('net_earnings, created_at, order:orders!order_items_order_id_fkey(payment_status)')
      .eq('seller_id', user.id)
      .gte('created_at', chartStart.toISOString())

    // Group by day
    const chartData: { date: string; revenue: number }[] = []
    for (let i = chartDays - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = date.toISOString().split('T')[0]

      const dayRevenue =
        chartOrderItems
          ?.filter(
            (item) => {
              const order = getRelation(item.order)
              return order?.payment_status === 'completed' &&
                item.created_at.startsWith(dateStr)
            }
          )
          .reduce(
            (sum, item) => sum + parseFloat(item.net_earnings.toString()),
            0
          ) || 0

      chartData.push({
        date: dateStr,
        revenue: dayRevenue,
      })
    }

    const responseData = {
      metrics: {
        revenue: {
          value: revenue,
          trend: revenueTrend,
          previousValue: previousRevenue,
        },
        sales: {
          value: salesCount,
          trend: salesTrend,
        },
        views: {
          value: totalViews,
          trend: viewsTrend,
          previousValue: previousPeriodViewCount,
        },
        rating: {
          value: avgRating,
          count: sellerReviews.length,
        },
      },
      chartData,
      timePeriod,
    }

    // Cache the metrics (upsert) - wrapped in try-catch since upsert doesn't return a Promise directly
    try {
      const { error: cacheError } = await supabase
        .from('seller_metrics_cache')
        .upsert(
          {
            seller_id: user.id,
            metric_type: 'dashboard_overview',
            time_period: timePeriod,
            value: revenue,
            previous_value: previousRevenue,
            last_calculated_at: new Date().toISOString(),
            expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(), // 15 minutes
          },
          {
            onConflict: 'seller_id,metric_type,time_period',
          }
        )
        .select()
      
      if (cacheError) {
        console.error('Error caching metrics:', cacheError)
        // Don't fail the request if caching fails
      }
    } catch (err) {
      console.error('Error caching metrics:', err)
      // Don't fail the request if caching fails
    }
    
    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error in GET /api/seller/dashboard/overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
