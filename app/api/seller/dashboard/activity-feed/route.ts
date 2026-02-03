import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/seller/dashboard/activity-feed/route.ts:GET',message:'getUser result',data:{hasUser:!!user,userId:user?.id?.slice(0,8)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A'})}).catch(()=>{});
    // #endregion

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a seller
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('role, can_sell, username')
      .eq('id', user.id)
      .single()

    // #region agent log
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/seller/dashboard/activity-feed/route.ts:userData',message:'users select result',data:{userDataError:userDataError?.message??null,role:userData?.role,can_sell:userData?.can_sell,hasUserData:!!userData},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'B,C,E'})}).catch(()=>{});
    // #endregion

    const allowed =
      userData &&
      (userData.role === 'admin' ||
        (userData.role === 'seller' && userData.can_sell))
    if (!allowed) {
      // #region agent log
      const reason = !userData ? 'noUserData' : userData.role !== 'seller' ? 'roleNotSeller' : 'can_sellFalse';
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'app/api/seller/dashboard/activity-feed/route.ts:403',message:'403 reason',data:{reason,role:userData?.role,can_sell:userData?.can_sell},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'A,B,C,E'})}).catch(()=>{});
      // #endregion
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const forceRefresh = searchParams.get('refresh') === 'true'

    // Check cache (5-minute TTL for activity feed)
    if (!forceRefresh) {
      const { data: cachedActivity } = await supabase
        .from('seller_metrics_cache')
        .select('*')
        .eq('seller_id', user.id)
        .eq('metric_type', 'activity_feed')
        .gt('expires_at', new Date().toISOString())
        .single()

      if (cachedActivity) {
        // Parse cached activities from value (stored as JSON string in value field)
        try {
          const cachedActivities = JSON.parse(cachedActivity.value.toString())
          return NextResponse.json({
            activities: cachedActivities.slice(offset, offset + limit),
            total: cachedActivities.length,
            cached: true,
          })
        } catch (e) {
          // If parsing fails, continue to fetch fresh data
        }
      }
    }

    const activities: Array<{
      type: 'sale' | 'review' | 'follower'
      title: string
      message: string
      icon: string
      timestamp: string
      actionUrl?: string
    }> = []

    // Get recent sales (last 10)
    const { data: recentSales } = await supabase
      .from('order_items')
      .select(
        `
        id,
        product_title,
        net_earnings,
        created_at,
        order:orders!order_items_order_id_fkey(
          payment_status,
          buyer_id,
          buyer:users!orders_buyer_id_fkey(first_name, last_name)
        )
      `
      )
      .eq('seller_id', user.id)
      .eq('order.payment_status', 'completed')
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentSales) {
      for (const sale of recentSales) {
        const order = Array.isArray(sale.order) ? sale.order[0] : sale.order
        const buyer = Array.isArray(order?.buyer) ? order.buyer[0] : order?.buyer
        const anonymizedName = buyer?.first_name
          ? formatBuyerName(buyer.first_name, buyer.last_name || '')
          : 'Anonymous'

        activities.push({
          type: 'sale',
          title: 'New sale',
          message: `${sale.product_title} sold to ${anonymizedName} (₱${parseFloat(sale.net_earnings.toString()).toFixed(2)})`,
          icon: '🎉',
          timestamp: sale.created_at,
          actionUrl: `/shop/orders`,
        })
      }
    }

    // Get recent reviews (last 5)
    const { data: recentReviews } = await supabase
      .from('reviews')
      .select(
        `
        id,
        rating,
        comment,
        created_at,
        buyer:users!reviews_buyer_id_fkey(first_name, last_name),
        product:products!reviews_product_id_fkey(
          id,
          title,
          seller_id
        )
      `
      )
      .eq('product.seller_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentReviews) {
      for (const review of recentReviews) {
        const buyer = Array.isArray(review.buyer) ? review.buyer[0] : review.buyer
        const anonymizedName = buyer?.first_name
          ? formatBuyerName(buyer.first_name, buyer.last_name || '')
          : 'Anonymous'

        const product = Array.isArray(review.product) ? review.product[0] : review.product
        activities.push({
          type: 'review',
          title: `New ${review.rating}-star review`,
          message: `${anonymizedName} reviewed "${product?.title || 'Product'}"`,
          icon: '⭐',
          timestamp: review.created_at,
          actionUrl: `/shop/reviews`,
        })
      }
    }

    // Get recent followers (last 5) - if followers table exists
    const { data: recentFollowers } = await supabase
      .from('followers')
      .select(
        `
        id,
        created_at,
        follower:users!followers_follower_id_fkey(first_name, last_name)
      `
      )
      .eq('following_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentFollowers) {
      for (const follower of recentFollowers) {
        const followerUser = Array.isArray(follower.follower) ? follower.follower[0] : follower.follower
        const anonymizedName = followerUser?.first_name
          ? formatBuyerName(followerUser.first_name, followerUser.last_name || '')
          : 'Someone'

        activities.push({
          type: 'follower',
          title: 'New follower',
          message: `${anonymizedName} started following you`,
          icon: '👤',
          timestamp: follower.created_at,
          actionUrl: `/sellers/${userData.username || user.id}`,
        })
      }
    }

    // Sort by timestamp (most recent first) and limit
    activities.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )

    const responseData = {
      activities: activities.slice(offset, offset + limit),
      total: activities.length,
    }

    // Cache activities (5-minute TTL)
    await supabase
      .from('seller_metrics_cache')
      .upsert(
        {
          seller_id: user.id,
          metric_type: 'activity_feed',
          time_period: 'all',
          value: activities.length, // Store count
          previous_value: null,
          last_calculated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes
        },
        {
          onConflict: 'seller_id,metric_type,time_period',
        }
      )

    return NextResponse.json(responseData)
  } catch (error) {
    console.error('Error in GET /api/seller/dashboard/activity-feed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatBuyerName(firstName: string, lastName: string): string {
  const first = (firstName || '').trim()
  const last = (lastName || '').trim()
  if (last) {
    return `Teacher ${first} ${last.charAt(0)}.`
  }
  return `Teacher ${first.charAt(0)}.`
}
