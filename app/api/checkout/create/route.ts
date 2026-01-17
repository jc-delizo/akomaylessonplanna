import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { item_ids } = body

    if (!item_ids || !Array.isArray(item_ids) || item_ids.length === 0) {
      return NextResponse.json({ error: 'item_ids array is required' }, { status: 400 })
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
      .in('id', item_ids)

    if (cartError || !cartItems || cartItems.length === 0) {
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
    let totalAmount = 0
    const orderItemsData: any[] = []

    for (const cartItem of cartItems) {
      const product = Array.isArray(cartItem.product) ? cartItem.product[0] : cartItem.product
      if (!product) continue
      
      totalAmount += product.price

      // Get seller's commission rate (20% default, 15% for Pioneers)
      const { data: seller } = await supabase
        .from('users')
        .select('is_pioneer, subscription_tier')
        .eq('id', product.seller_id)
        .single()

      const commissionRate = seller?.is_pioneer ? 15.0 : 20.0
      const commissionAmount = (product.price * commissionRate) / 100
      const netEarnings = product.price - commissionAmount

      orderItemsData.push({
        product_id: product.id,
        seller_id: product.seller_id,
        product_title: product.title,
        product_cover_image_url: product.cover_image_url,
        price_at_purchase: product.price,
        commission_rate: commissionRate,
        commission_amount: commissionAmount,
        net_earnings: netEarnings,
        product_version_at_purchase: product.current_version,
      })
    }

    const totalCommission = orderItemsData.reduce(
      (sum, item) => sum + item.commission_amount,
      0
    )

    // Create order
    const paymentExpiresAt = new Date()
    paymentExpiresAt.setMinutes(paymentExpiresAt.getMinutes() + 15) // 15-minute timeout
    // #region agent log
    const logData = {location:'checkout/create/route.ts:96',message:'Creating order with payment_expires_at',data:{now:new Date().toISOString(),expiresAt:paymentExpiresAt.toISOString(),expiresAtMs:paymentExpiresAt.getTime(),nowMs:Date.now(),timeDiffMs:paymentExpiresAt.getTime() - Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'};
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData)}).catch(()=>{});
    // #endregion

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        total_amount: totalAmount,
        total_commission: totalCommission,
        item_count: cartItems.length,
        payment_method: 'gcash', // Will be updated when payment method is selected
        payment_status: 'pending',
        payment_expires_at: paymentExpiresAt.toISOString(),
      })
      .select()
      .single()
    
    // #region agent log
    if (order) {
      const logData2 = {location:'checkout/create/route.ts:113',message:'Order created',data:{orderId:order.id,paymentExpiresAt:order.payment_expires_at,paymentStatus:order.payment_status},timestamp:Date.now(),sessionId:'debug-session',runId:'pre-fix',hypothesisId:'C'};
      fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(logData2)}).catch(()=>{});
    }
    // #endregion

    if (orderError || !order) {
      console.error('Error creating order:', orderError)
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    // Create order items
    const orderItems = orderItemsData.map((item) => ({
      ...item,
      order_id: order.id,
    }))

    const { error: orderItemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (orderItemsError) {
      console.error('Error creating order items:', orderItemsError)
      // Rollback order creation
      await supabase.from('orders').delete().eq('id', order.id)
      return NextResponse.json({ error: 'Failed to create order items' }, { status: 500 })
    }

    // Remove items from cart
    const { error: cartDeleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('user_id', user.id)
      .in('id', item_ids)

    if (cartDeleteError) {
      console.error('Error removing items from cart:', cartDeleteError)
      // Don't fail the request, just log the error
    }

    return NextResponse.json(
      {
        order_id: order.id,
        total_amount: totalAmount,
        item_count: cartItems.length,
        payment_expires_at: paymentExpiresAt.toISOString(),
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/checkout/create:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
