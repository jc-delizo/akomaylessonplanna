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

    // Get order items with buyer data
    const { data: orderItems } = await supabase
      .from('order_items')
      .select(
        `
        product_id,
        order:orders!order_items_order_id_fkey(
          buyer_id,
          buyer:users!orders_buyer_id_fkey(
            grade_levels_taught,
            location_region
          )
        )
      `
      )
      .eq('seller_id', user.id)

    // Get products to map to grades
    const { data: products } = await supabase
      .from('products')
      .select('id, grade:grades!products_grade_id_fkey(name)')
      .eq('seller_id', user.id)

    // Grade levels breakdown
    const gradeLevels: Record<string, number> = {}
    orderItems?.forEach((item) => {
      const product = products?.find((p) => p.id === item.product_id)
      const grade = Array.isArray(product?.grade) ? product.grade[0] : product?.grade
      if (grade?.name) {
        gradeLevels[grade.name] = (gradeLevels[grade.name] || 0) + 1
      }
    })

    // Regions breakdown
    const regions: Record<string, number> = {}
    orderItems?.forEach((item) => {
      const order = Array.isArray(item.order) ? item.order[0] : item.order
      const buyer = Array.isArray(order?.buyer) ? order.buyer[0] : order?.buyer
      const region = buyer?.location_region
      if (region) {
        regions[region] = (regions[region] || 0) + 1
      }
    })

    // Repeat customer rate
    const buyerIds = new Set(
      orderItems?.map((item) => {
        const order = Array.isArray(item.order) ? item.order[0] : item.order
        return order?.buyer_id
      }).filter(Boolean) || []
    )
    const totalBuyers = buyerIds.size
    const repeatBuyers = Array.from(buyerIds).filter((buyerId) => {
      const orders = orderItems?.filter((item) => {
        const order = Array.isArray(item.order) ? item.order[0] : item.order
        return order?.buyer_id === buyerId
      }) || []
      return orders.length > 1
    }).length

    const repeatCustomerRate = totalBuyers > 0 ? (repeatBuyers / totalBuyers) * 100 : 0

    return NextResponse.json({
      gradeLevels: Object.entries(gradeLevels).map(([grade, count]) => ({
        grade,
        count,
        percentage: (count / (orderItems?.length || 1)) * 100,
      })),
      regions: Object.entries(regions).map(([region, count]) => ({
        region,
        count,
        percentage: (count / (orderItems?.length || 1)) * 100,
      })),
      repeatCustomerRate,
      totalBuyers,
      repeatBuyers,
    })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/demographics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
