import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ orderId: string }>
}

/**
 * Development/Testing endpoint to manually complete orders
 * This simulates payment completion for testing purposes
 * Only works in development mode
 */
export async function POST(request: Request, { params }: RouteParams) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Not available in production' }, { status: 403 })
    }

    const { orderId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, payment_status, total_amount')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify order belongs to user
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only process if order is pending
    if (order.payment_status !== 'pending') {
      return NextResponse.json(
        { error: `Order is already ${order.payment_status}` },
        { status: 400 }
      )
    }

    // Update order status to completed (simulating payment webhook)
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'completed',
        payment_reference: `TEST-${Date.now()}`,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Failed to complete order' }, { status: 500 })
    }

    // Get order items with IDs
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('id, product_id, seller_id')
      .eq('order_id', orderId)

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
        // Don't fail, just log
      }

      // Update product sales counts
      for (const item of orderItems) {
        const { error: salesError } = await supabase.rpc('increment_product_sales', {
          product_id: item.product_id,
        })
        if (salesError) {
          console.error('Error incrementing sales:', salesError)
        }
      }

      // Send order confirmation email (if email system is set up)
      const { data: buyer } = await supabase
        .from('users')
        .select('email, name')
        .eq('id', order.buyer_id)
        .single()

      if (buyer) {
        try {
          const { sendOrderConfirmationEmail, sendNewSaleEmail } = await import('@/lib/emails/notifications')
          
          // Get order items for email
          const { data: itemsForEmail } = await supabase
            .from('order_items')
            .select('product_title, price_at_purchase')
            .eq('order_id', orderId)

          if (itemsForEmail) {
            await sendOrderConfirmationEmail(
              buyer.email,
              orderId,
              itemsForEmail.map((item) => ({
                title: item.product_title,
                price: parseFloat(item.price_at_purchase.toString()),
              })),
              parseFloat(order.total_amount.toString())
            )
          }

          // Send seller notifications
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
                  const { data: orderItemData } = await supabase
                    .from('order_items')
                    .select('price_at_purchase, net_earnings')
                    .eq('id', item.id)
                    .single()

                  if (orderItemData) {
                    await sendNewSaleEmail(
                      seller.email,
                      product.title,
                      parseFloat(orderItemData.price_at_purchase.toString()),
                      parseFloat(orderItemData.net_earnings.toString()),
                      buyer.name
                    )
                  }
                }
              }
            }
          }
        } catch (emailError) {
          console.error('Error sending emails:', emailError)
          // Don't fail the request
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Order completed successfully (TEST MODE)',
      order_id: orderId,
    })
  } catch (error) {
    console.error('Error in POST /api/orders/[orderId]/complete-test:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
