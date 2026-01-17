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
    const status = searchParams.get('status') // 'all', 'completed', 'pending', 'failed'
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const productId = searchParams.get('product_id')
    const location = searchParams.get('location')

    // Get order items for this seller
    let query = supabase
      .from('order_items')
      .select(
        `
        id,
        order_id,
        product_id,
        product_title,
        product_cover_image_url,
        price_at_purchase,
        commission_rate,
        commission_amount,
        net_earnings,
        download_count,
        created_at,
        order:orders!order_items_order_id_fkey(
          id,
          created_at,
          payment_method,
          payment_status,
          buyer_id
        )
      `
      )
      .eq('seller_id', user.id)

    // Filter by status if provided
    if (status && status !== 'all') {
      query = query.eq('order.payment_status', status)
    }

    // Filter by date range
    if (dateFrom) {
      query = query.gte('created_at', dateFrom)
    }
    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      query = query.lte('created_at', toDate.toISOString())
    }

    // Filter by product
    if (productId && productId !== 'all') {
      query = query.eq('product_id', productId)
    }

    const { data: orderItems, error } = await query.order('created_at', { ascending: false })

    // Filter by location (after fetching, since it's on buyer)
    let filteredItems = orderItems || []
    if (location && location !== 'All regions') {
      // We'll filter this after getting buyer data
    }

    if (error) {
      console.error('Error fetching seller orders:', error)
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
    }

    // Get buyer names and location (anonymized) for each order
    let orderItemsWithBuyers = await Promise.all(
      filteredItems.map(async (item) => {
        if (item.order?.buyer_id) {
          const { data: buyer } = await supabase
            .from('users')
            .select('name, location_region')
            .eq('id', item.order.buyer_id)
            .single()

          return {
            ...item,
            buyer: buyer
              ? {
                  id: buyer.id,
                  name: buyer.name,
                  location_region: buyer.location_region,
                }
              : undefined,
          }
        }
        return item
      })
    )

    // Filter by location if provided
    if (location && location !== 'All regions') {
      orderItemsWithBuyers = orderItemsWithBuyers.filter(
        (item) => item.buyer?.location_region === location
      )
    }

    return NextResponse.json({ orders: orderItemsWithBuyers })
  } catch (error) {
    console.error('Error in GET /api/seller/orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
