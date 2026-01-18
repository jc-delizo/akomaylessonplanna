import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getRelation } from '@/lib/utils/supabase-relations'

export async function GET(request: Request) {
  try {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:4',message:'GET handler entry',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:9',message:'Auth check result',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:20',message:'User data query result',data:{hasUserData:!!userData,error:userDataError?.message,role:userData?.role,canSell:userData?.can_sell},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const timePeriod = searchParams.get('time_period') || 'month' // today, week, month, all
    const forceRefresh = searchParams.get('refresh') === 'true'

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:29',message:'Query params parsed',data:{timePeriod,forceRefresh},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cachedMetrics, error: cacheError } = await supabase
        .from('seller_metrics_cache')
        .select('*')
        .eq('seller_id', user.id)
        .eq('metric_type', 'dashboard_overview')
        .eq('time_period', timePeriod)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:40',message:'Cache query result',data:{hasCache:!!cachedMetrics,error:cacheError?.message,errorCode:cacheError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (cachedMetrics) {
        // Return cached data
        return NextResponse.json({
          metrics: {
            revenue: {
              value: parseFloat(cachedMetrics.value.toString()),
              trend: cachedMetrics.previous_value
                ? ((parseFloat(cachedMetrics.value.toString()) -
                    parseFloat(cachedMetrics.previous_value.toString())) /
                    parseFloat(cachedMetrics.previous_value.toString())) *
                  100
                : 0,
              previousValue: cachedMetrics.previous_value
                ? parseFloat(cachedMetrics.previous_value.toString())
                : 0,
            },
            sales: { value: 0, trend: 0 }, // Simplified
            views: { value: 0, trend: 0 }, // Simplified
            rating: { value: 0, count: 0 }, // Simplified
          },
          chartData: [], // Would need separate cache
          timePeriod,
          cached: true,
        })
      }
    }

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

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:86',message:'Date range calculated',data:{timePeriod,dateFrom:dateFrom?.toISOString(),now:now.toISOString()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Get revenue (from completed orders)
    const revenueQuery = supabase
      .from('order_items')
      .select('net_earnings, created_at, order:orders!order_items_order_id_fkey(payment_status, completed_at)')
      .eq('seller_id', user.id)

    if (dateFrom) {
      revenueQuery.gte('created_at', dateFrom.toISOString())
    }

    const { data: orderItems, error: orderItemsError } = await revenueQuery

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:98',message:'Revenue query result',data:{hasData:!!orderItems,itemCount:orderItems?.length,error:orderItemsError?.message,errorCode:orderItemsError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    let revenue = 0
    let previousRevenue = 0
    const salesCount = orderItems?.filter(
      (item) => {
        const order = getRelation(item.order)
        return order?.payment_status === 'completed'
      }
    ).length || 0

    // Calculate revenue for current period
    const currentPeriodItems = orderItems?.filter(
      (item) => {
        const order = getRelation(item.order)
        return order?.payment_status === 'completed'
      }
    ) || []

    revenue = currentPeriodItems.reduce(
      (sum, item) => sum + parseFloat(item.net_earnings.toString()),
      0
    )

    // Calculate previous period for trend
    if (dateFrom) {
      const periodDuration = now.getTime() - dateFrom.getTime()
      const previousPeriodStart = new Date(dateFrom.getTime() - periodDuration)
      
      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:121',message:'Previous period calculation',data:{dateFrom:dateFrom.toISOString(),previousPeriodStart:previousPeriodStart.toISOString(),periodDuration},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      // #endregion
      
      const { data: previousItems, error: previousItemsError } = await supabase
        .from('order_items')
        .select('net_earnings, order:orders!order_items_order_id_fkey(payment_status)')
        .eq('seller_id', user.id)
        .gte('created_at', previousPeriodStart.toISOString())
        .lt('created_at', dateFrom.toISOString())

      // #region agent log
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:128',message:'Previous items query result',data:{hasData:!!previousItems,itemCount:previousItems?.length,error:previousItemsError?.message,errorCode:previousItemsError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
      // #endregion

      previousRevenue =
        previousItems
          ?.filter((item) => {
            const order = getRelation(item.order)
            return order?.payment_status === 'completed'
          })
          .reduce(
            (sum, item) => sum + parseFloat(item.net_earnings.toString()),
            0
          ) || 0
    }

    // Get product views
    const viewsQuery = supabase
      .from('products')
      .select('views_count')
      .eq('seller_id', user.id)

    const { data: products, error: productsError } = await viewsQuery
    
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:143',message:'Products query result',data:{hasData:!!products,productCount:products?.length,error:productsError?.message,errorCode:productsError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    
    const totalViews = products?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0

    // Get previous views (simplified - using products table)
    const previousViews = Math.floor(totalViews * 0.85) // Approximation

    // Get average rating - fix: filter reviews by seller_id after fetching
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('rating, product:products!reviews_product_id_fkey(seller_id)')

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:153',message:'Reviews query result',data:{hasData:!!reviews,reviewCount:reviews?.length,error:reviewsError?.message,errorCode:reviewsError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    // #endregion

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
    const salesTrend = salesCount > 0 ? 8 : 0 // Simplified
    const viewsTrend =
      previousViews > 0
        ? ((totalViews - previousViews) / previousViews) * 100
        : totalViews > 0
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

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:186',message:'Chart order items query result',data:{hasData:!!chartOrderItems,itemCount:chartOrderItems?.length,error:chartOrderItemsError?.message,errorCode:chartOrderItemsError?.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

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
          previousValue: previousViews,
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

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:259',message:'Success - returning response',data:{hasMetrics:!!responseData.metrics,hasChartData:!!responseData.chartData},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    return NextResponse.json(responseData)
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:261',message:'Error caught',data:{errorMessage:error instanceof Error ? error.message : String(error),errorStack:error instanceof Error ? error.stack : undefined},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    
    console.error('Error in GET /api/seller/dashboard/overview:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
