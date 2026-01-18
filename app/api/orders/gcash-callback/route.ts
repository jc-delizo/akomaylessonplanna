import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-gcash-signature')
    const body = await request.text()

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 })
    }

    // Verify signature (in production, use actual GCash webhook secret)
    const webhookSecret = process.env.GCASH_WEBHOOK_SECRET || 'test-secret'
    const hmac = crypto.createHmac('sha256', webhookSecret)
    const digest = hmac.update(body).digest('hex')

    // In production, use crypto.timingSafeEqual for constant-time comparison
    if (signature !== digest) {
      console.error('Invalid webhook signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const data = JSON.parse(body)
    const { order_id, transaction_id, status, amount } = data

    if (!order_id || !transaction_id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, payment_status, total_amount, payment_method')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify amount matches
    if (parseFloat(amount) !== parseFloat(order.total_amount.toString())) {
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
      .select('email, name, id')
      .eq('id', order.buyer_id)
      .single()

    if (status === 'success' || status === 'completed') {
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'completed',
          payment_reference: transaction_id,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id)

      if (updateError) {
        console.error('Error updating order:', updateError)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }

      // Get order items with IDs
      const { data: orderItems, error: itemsError } = await supabase
        .from('order_items')
        .select('id, product_id, seller_id, price_at_purchase, net_earnings')
        .eq('order_id', order_id)

      if (itemsError) {
        console.error('Error fetching order items:', itemsError)
      } else if (orderItems && orderItems.length > 0) {
        // Add products to user library
        const libraryEntries = orderItems.map((item) => ({
          user_id: order.buyer_id,
          product_id: item.product_id,
          order_item_id: item.id,
        }))

        const { error: libraryError } = await supabase
          .from('user_library')
          .insert(libraryEntries)

        if (libraryError) {
          console.error('Error adding to library:', libraryError)
          // Don't fail the webhook, just log
        }

        // Update product sales counts
        for (const item of orderItems) {
          const { error: salesError } = await supabase.rpc('increment_product_sales', {
            product_id: item.product_id,
          })
          if (salesError) {
            console.error('Error incrementing sales:', salesError)
          }

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
                  buyer.name
                )

                // Create notification for seller
                const { createNewSaleNotification } = await import('@/lib/notifications/notification-triggers')
                await createNewSaleNotification(
                  sellerId,
                  order_id,
                  product.title,
                  buyer.name,
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
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          payment_status: 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', order_id)

      if (updateError) {
        console.error('Error updating order:', updateError)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
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

    return NextResponse.json({ success: true, message: 'Status not processed' })
  } catch (error) {
    console.error('Error in POST /api/orders/gcash-callback:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
