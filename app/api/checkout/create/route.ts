import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { parseAmountToCentavos } from '@/lib/security/request-security'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

interface OrderItemInsert {
  product_id: string
  seller_id: string
  product_title: string
  product_cover_image_url: string | null
  price_at_purchase: number
  commission_rate: number
  commission_amount: number
  net_earnings: number
  product_version_at_purchase: number
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (process.env.PAYMENTS_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Checkout is temporarily unavailable while payments are being configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { item_ids } = body

    if (!Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json({ error: 'item_ids array is required' }, { status: 400 })
    }

    const selectedItemIds = [...new Set(item_ids)]
    if (
      selectedItemIds.length > 100 ||
      selectedItemIds.some((id) => typeof id !== 'string' || !UUID_PATTERN.test(id))
    ) {
      return NextResponse.json({ error: 'item_ids contains invalid values' }, { status: 400 })
    }

    // Fetch cart items with product details
    const { data: cartItems, error: cartError } = await supabase
      .from('cart_items')
      .select(
        `
        id,
        product_id,
        product:products!cart_items_product_id_fkey(
          id,
          title,
          price,
          cover_image_url,
          seller_id,
          current_version,
          status
        )
      `
      )
      .eq('user_id', user.id)
      .in('id', selectedItemIds)

    if (cartError || !cartItems || cartItems.length !== selectedItemIds.length) {
      return NextResponse.json({ error: 'Cart items not found' }, { status: 404 })
    }

    // Validate all products are published
    const invalidProducts = cartItems.filter(
      (item) => {
        const product = Array.isArray(item.product) ? item.product[0] : item.product
        return product?.status !== 'published'
      }
    )
    if (invalidProducts.length > 0) {
      return NextResponse.json(
        { error: 'Some products are no longer available' },
        { status: 400 }
      )
    }

    // Calculate totals
    let totalCentavos = 0
    const orderItemsData: OrderItemInsert[] = []
    const adminClient = createAdminClient()

    for (const cartItem of cartItems) {
      const product = Array.isArray(cartItem.product) ? cartItem.product[0] : cartItem.product
      if (!product) continue

      if (product.seller_id === user.id) {
        return NextResponse.json({ error: 'You cannot purchase your own product' }, { status: 400 })
      }

      const priceInCentavos = parseAmountToCentavos(product.price)
      if (priceInCentavos === null || priceInCentavos <= 0) {
        return NextResponse.json({ error: 'A product has an invalid price' }, { status: 400 })
      }

      totalCentavos += priceInCentavos

      // Get seller's commission rate (20% default, 15% for Pioneers)
      const { data: seller } = await adminClient
        .from('users')
        .select('is_pioneer, subscription_tier')
        .eq('id', product.seller_id)
        .single()

      const commissionRate = seller?.is_pioneer ? 15.0 : 20.0
      const commissionInCentavos = Math.round((priceInCentavos * commissionRate) / 100)
      const priceAtPurchase = priceInCentavos / 100
      const commissionAmount = commissionInCentavos / 100
      const netEarnings = (priceInCentavos - commissionInCentavos) / 100

      orderItemsData.push({
        product_id: product.id,
        seller_id: product.seller_id,
        product_title: product.title,
        product_cover_image_url: product.cover_image_url ?? null,
        price_at_purchase: priceAtPurchase,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        net_earnings: netEarnings,
        product_version_at_purchase: product.current_version,
      })
    }

    if (orderItemsData.length !== cartItems.length || !Number.isSafeInteger(totalCentavos)) {
      return NextResponse.json({ error: 'Unable to calculate order total' }, { status: 400 })
    }

    const totalAmount = totalCentavos / 100

    const totalCommission = orderItemsData.reduce(
      (sum, item) => sum + item.commission_amount,
      0
    )

    // Create order
    const paymentExpiresAt = new Date()
    paymentExpiresAt.setMinutes(paymentExpiresAt.getMinutes() + 15) // 15-minute timeout

    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .insert({
        buyer_id: user.id,
        total_amount: totalAmount,
        total_commission: totalCommission,
        item_count: orderItemsData.length,
        payment_method: 'gcash', // Will be updated when payment method is selected
        payment_status: 'pending',
        payment_expires_at: paymentExpiresAt.toISOString(),
      })
      .select()
      .single()

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order items
    const orderItems = orderItemsData.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const { error: orderItemsError } = await adminClient
      .from('order_items')
      .insert(orderItems)

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError)
      // Rollback order creation
      await adminClient.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Remove items from cart
    const { error: cartDeleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .in('id', selectedItemIds)

    if (cartDeleteError) {
      console.error('Error removing items from cart:', cartDeleteError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json(
      {
        order_id: order.id,
        total_amount: totalAmount,
        item_count: orderItemsData.length,
        payment_expires_at: paymentExpiresAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/checkout/create:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
