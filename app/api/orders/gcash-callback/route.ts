import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import {
  hasValidHmacSha256Signature,
  parseAmountToCentavos,
} from '@/lib/security/request-security'

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export async function POST(request: Request) {
  try {
    const signature = request.headers.get('x-gcash-signature')
    const body = await request.text()
    const webhookSecret = process.env.GCASH_WEBHOOK_SECRET

    if (!webhookSecret) {
      console.error('GCASH_WEBHOOK_SECRET is not configured')
      return NextResponse.json({ error: 'Webhook is not configured' }, { status: 503 })
    }

    if (!hasValidHmacSha256Signature(body, signature, webhookSecret)) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    let data: Record<string, unknown>
    try {
      data = JSON.parse(body) as Record<string, unknown>
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 })
    }

    const { order_id, transaction_id, status, amount } = data

    if (
      typeof order_id !== 'string' ||
      !UUID_PATTERN.test(order_id) ||
      typeof transaction_id !== 'string' ||
      typeof status !== 'string' ||
      transaction_id.trim().length === 0 ||
      transaction_id.length > 100
    ) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const callbackAmount = parseAmountToCentavos(amount)
    if (callbackAmount === null) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, payment_status, total_amount, payment_method')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.payment_method !== 'gcash') {
      return NextResponse.json({ error: 'Payment method mismatch' }, { status: 400 })
    }

    const orderAmount = parseAmountToCentavos(order.total_amount)
    if (orderAmount === null || callbackAmount !== orderAmount) {
      console.error('Amount mismatch:', amount, order.total_amount)
      return NextResponse.json({ error: 'Amount mismatch' }, { status: 400 })
    }

    // Only process if order is still pending
    if (order.payment_status !== 'pending') {
      // Idempotency: if already processed, return success
      return NextResponse.json({ success: true, message: 'Already processed' })
    }

    // Get buyer info (needed for both success and failure scenarios)
    const { data: buyer } = await supabase
      .from('users')
      .select('email, first_name, last_name, id')
      .eq('id', order.buyer_id)
      .single()

    if (status === 'success' || status === 'completed') {
      const { data: completed, error: updateError } = await supabase.rpc(
        'complete_order_payment',
        {
          p_order_id: order_id,
          p_payment_reference: transaction_id.trim(),
          p_payment_method: 'gcash',
          p_total_amount: callbackAmount / 100,
        }
      )

      if (updateError) {
        console.error('Error updating order:', updateError)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }

      if (!completed) {
        return NextResponse.json({ success: true, message: 'Already processed' })
      }

      // Get order items with IDs
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id, product_id, seller_id, price_at_purchase, net_earnings')
        .eq('order_id', order_id)

      if (itemsError) {
        console.error('Error fetching order items:', itemsError)
      } else if (orderItems && orderItems.length > 0) {
        for (const item of orderItems) {
          // Invalidate seller dashboard cache
          const { invalidateSellerDashboardCache } = await import('@/lib/utils/cache-invalidation')
          await invalidateSellerDashboardCache(item.seller_id).catch((err) => {
            console.error('Error invalidating cache:', err)
          })
        }
      }

      // Send order confirmation and payment successful emails
      if (buyer) {
        const { sendOrderConfirmationEmail, sendNewSaleEmail } = await import('@/lib/emails/notifications')
        const { sendPaymentSuccessfulEmail, sendDownloadReadyEmail } = await import('@/lib/emails/checkout-emails')
        
        // Get order items for email
        const { data: itemsForEmail } = await supabase
          .from('order_items')
          .select('product_title, price_at_purchase, product_id')
          .eq('order_id', order_id)

        if (itemsForEmail) {
          // Send order confirmation email
          await sendOrderConfirmationEmail(
            buyer.email,
            order_id,
            itemsForEmail.map((item) => ({
              title: item.product_title,
              price: parseFloat(item.price_at_purchase.toString()),
            })),
            parseFloat(order.total_amount.toString())
          )

          // Send payment successful email
          await sendPaymentSuccessfulEmail(
            buyer.id,
            order_id,
            parseFloat(order.total_amount.toString()),
            order.payment_method || 'GCash'
          )

          // Send download ready email for each product
          for (const item of itemsForEmail) {
            await sendDownloadReadyEmail(
              buyer.id,
              order_id,
              item.product_title
            )
          }
        }

        // Send seller notifications
        if (!orderItems || orderItems.length === 0) {
          return NextResponse.json({ success: true, message: 'Order processed but no items found' })
        }
        
        const sellerIds = [...new Set(orderItems.map((item) => item.seller_id))]
        for (const sellerId of sellerIds) {
          const { data: seller } = await supabase
            .from('users')
            .select('email')
            .eq('id', sellerId)
            .single()

          if (seller) {
            const sellerItems = orderItems.filter((item) => item.seller_id === sellerId)
            for (const item of sellerItems) {
              const { data: product } = await supabase
                .from('products')
                .select('title')
                .eq('id', item.product_id)
                .single()

              if (product) {
                await sendNewSaleEmail(
                  seller.email,
                  product.title,
                  parseFloat(item.price_at_purchase.toString()),
                  parseFloat(item.net_earnings.toString()),
                  buyer ? `${buyer.first_name} ${buyer.last_name || ''}`.trim() : 'Buyer'
                )

                // Create notification for seller
                const { createNewSaleNotification } = await import('@/lib/notifications/notification-triggers')
                await createNewSaleNotification(
                  sellerId,
                  order_id,
                  product.title,
                  buyer ? `${buyer.first_name} ${buyer.last_name || ''}`.trim() : 'Buyer',
                  parseFloat(item.price_at_purchase.toString())
                )
              }
            }
          }
        }
      }

      return NextResponse.json({ success: true })
    } else if (status === 'failed' || status === 'cancelled') {
      // Update order status to failed
      const { data: updatedOrder, error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id)
        .eq('payment_status', 'pending')
        .select('id')
        .maybeSingle()

      if (updateError) {
        console.error('Error updating order:', updateError)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }

      if (!updatedOrder) {
        return NextResponse.json({ success: true, message: 'Already processed' })
      }

      // Send payment failed email
      if (buyer) {
        try {
          const { sendPaymentFailedEmail } = await import('@/lib/emails/notifications')
          await sendPaymentFailedEmail(buyer.email, order_id)
        } catch (emailError) {
          console.error('Error sending payment failed email:', emailError)
        }
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Unsupported payment status' }, { status: 400 })
  } catch (error) {
    console.error('Error in POST /api/orders/gcash-callback:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
