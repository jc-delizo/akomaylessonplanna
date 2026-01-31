import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { getRelation } from '@/lib/utils/supabase-relations'

/**
 * GET /api/seller/analytics/funnel
 * Pro/Pioneer only. Returns three stages: Product Views, Add to Cart, Purchases.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

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

    // Seller's product IDs
    const { data: sellerProducts } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id)

    const productIds = (sellerProducts || []).map((p) => p.id)
    if (productIds.length === 0) {
      return NextResponse.json({
        stages: [
          { name: 'Product Views', value: 0 },
          { name: 'Add to Cart', value: 0 },
          { name: 'Purchases', value: 0 },
        ],
      })
    }

    // Stage 1: Product Views (count rows in product_views for seller's products)
    const { count: viewsCount } = await supabase
      .from('product_views')
      .select('*', { count: 'exact', head: true })
      .in('product_id', productIds)

    // Stage 2: Add to Cart (count cart_add_events for seller)
    const { count: cartCount } = await supabase
      .from('cart_add_events')
      .select('*', { count: 'exact', head: true })
      .eq('seller_id', user.id)

    // Stage 3: Purchases (order_items with completed order)
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('order:orders!order_items_order_id_fkey(payment_status)')
      .eq('seller_id', user.id)

    const purchasesCount = (orderItems || []).filter(
      (item) => getRelation(item.order)?.payment_status === 'completed'
    ).length

    return NextResponse.json({
      stages: [
        { name: 'Product Views', value: viewsCount ?? 0 },
        { name: 'Add to Cart', value: cartCount ?? 0 },
        { name: 'Purchases', value: purchasesCount },
      ],
    })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/funnel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
