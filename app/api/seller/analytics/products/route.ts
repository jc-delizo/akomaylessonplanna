import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

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

    // Get products with sales data
    const { data: products } = await supabase
      .from('products')
      .select('id, title, product_type, price, sales_count, views_count, conversion_rate, avg_rating')
      .eq('seller_id', user.id)
      .eq('status', 'published')

    // Get order items for revenue calculation
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, net_earnings, order:orders!order_items_order_id_fkey(payment_status)')
      .eq('seller_id', user.id)

    // Calculate revenue per product
    const productRevenue: Record<string, number> = {}
    orderItems
      ?.filter((item) => {
        const order = Array.isArray(item.order) ? item.order[0] : item.order
        return order?.payment_status === 'completed'
      })
      .forEach((item) => {
        productRevenue[item.product_id] =
          (productRevenue[item.product_id] || 0) + parseFloat(item.net_earnings.toString())
      })

    // Top products by revenue
    const topProducts = (products || [])
      .map((p) => ({
        id: p.id,
        title: p.title,
        revenue: productRevenue[p.id] || 0,
        sales: p.sales_count || 0,
        views: p.views_count || 0,
        conversion: p.conversion_rate || 0,
        rating: p.avg_rating || 0,
        category: p.product_type,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Sales by category
    const categorySales: Record<string, number> = {}
    orderItems
      ?.filter((item) => {
        const order = Array.isArray(item.order) ? item.order[0] : item.order
        return order?.payment_status === 'completed'
      })
      .forEach((item) => {
        const product = products?.find((p) => p.id === item.product_id)
        if (product) {
          const category = product.product_type
          categorySales[category] =
            (categorySales[category] || 0) + parseFloat(item.net_earnings.toString())
        }
      })

    // Performance scores (0-100)
    const performanceScores = (products || []).map((p) => {
      const viewsScore = Math.min((p.views_count || 0) / 100, 1) * 20
      const salesScore = Math.min((p.sales_count || 0) / 10, 1) * 40
      const conversionScore = Math.min((p.conversion_rate || 0) / 10, 1) * 20
      const ratingScore = ((p.avg_rating || 0) / 5) * 20

      return {
        productId: p.id,
        score: viewsScore + salesScore + conversionScore + ratingScore,
      }
    })

    return NextResponse.json({
      topProducts,
      categorySales: Object.entries(categorySales).map(([category, revenue]) => ({
        category,
        revenue,
      })),
      performanceScores,
    })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
