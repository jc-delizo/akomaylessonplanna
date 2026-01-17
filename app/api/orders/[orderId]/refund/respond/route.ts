import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ orderId: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { orderId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, message } = body // action: 'approve', 'dispute', 'offer_fix'

    if (!action || !['approve', 'dispute', 'offer_fix'].includes(action)) {
      return NextResponse.json(
        { error: 'action must be "approve", "dispute", or "offer_fix"' },
        { status: 400 }
      )
    }

    // Get order and verify seller owns products in this order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, refund_status, refund_reason, total_amount, payment_method, payment_reference')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify seller owns products in this order
    const { data: orderItems, error: itemsError } = await supabase
      .from('order_items')
      .select('seller_id')
      .eq('order_id', orderId)
      .eq('seller_id', user.id)
      .limit(1)

    if (itemsError || !orderItems || orderItems.length === 0) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (order.refund_status !== 'requested') {
      return NextResponse.json(
        { error: 'Order does not have a pending refund request' },
        { status: 400 }
      )
    }

    if (action === 'approve') {
      // Process refund automatically
      // Update order status
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          refund_status: 'approved',
          refund_processed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order:', updateError)
        return NextResponse.json({ error: 'Failed to approve refund' }, { status: 500 })
      }

      // TODO: Process refund via GCash/Maya Refund API
      // const refundReference = await processRefund(order.payment_method, order.payment_reference, order.total_amount)
      // await supabase.from('orders').update({ refund_reference: refundReference }).eq('id', orderId)

      // Remove products from user library
      const { data: libraryItems } = await supabase
        .from('user_library')
        .select('id')
        .eq('user_id', order.buyer_id)

      if (libraryItems) {
        const { data: orderItemsForLibrary } = await supabase
          .from('order_items')
          .select('product_id')
          .eq('order_id', orderId)

        if (orderItemsForLibrary) {
          const productIds = orderItemsForLibrary.map((item) => item.product_id)
          await supabase
            .from('user_library')
            .delete()
            .eq('user_id', order.buyer_id)
            .in('product_id', productIds)
        }
      }

      // Send refund approved email to buyer
      const { data: buyer } = await supabase
        .from('users')
        .select('email')
        .eq('id', order.buyer_id)
        .single()

      if (buyer) {
        const { sendRefundApprovedEmail } = await import('@/lib/emails/notifications')
        await sendRefundApprovedEmail(
          buyer.email,
          orderId,
          parseFloat(order.total_amount.toString())
        )
      }

      return NextResponse.json({ message: 'Refund approved and processed' })
    } else if (action === 'dispute') {
      // Seller disputes the refund
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          refund_status: 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId)

      if (updateError) {
        console.error('Error updating order:', updateError)
        return NextResponse.json({ error: 'Failed to dispute refund' }, { status: 500 })
      }

      // TODO: Send dispute notification to buyer
      // Buyer can now escalate to platform

      return NextResponse.json({ message: 'Refund disputed. Buyer can escalate to platform support.' })
    } else if (action === 'offer_fix') {
      // Seller offers to fix the issue
      // Keep refund_status as 'requested' but add seller message
      // TODO: Store seller message in a separate table or add to order
      // For now, we'll just return success
      // TODO: Send message to buyer via messaging system

      return NextResponse.json({ message: 'Fix offer sent to buyer' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error in POST /api/orders/[orderId]/refund/respond:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
