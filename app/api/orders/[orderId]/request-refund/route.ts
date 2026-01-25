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
    const { reason, description } = body

    if (!reason || !description || description.length < 20) {
      return NextResponse.json(
        { error: 'Reason and description (minimum 20 characters) are required' },
        { status: 400 }
      )
    }

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, created_at, refund_status')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify order belongs to user
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if refund already requested
    if (order.refund_status !== 'none') {
      return NextResponse.json(
        { error: 'Refund request already submitted' },
        { status: 400 }
      )
    }

    // Check 7-day window
    const orderDate = new Date(order.created_at)
    const daysSincePurchase = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSincePurchase > 7) {
      return NextResponse.json(
        { error: 'Refund window has expired. Refunds must be requested within 7 days of purchase.' },
        { status: 400 }
      )
    }

    // Update order with refund request
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        refund_status: 'requested',
        refund_reason: `${reason}: ${description}`,
        refund_requested_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Failed to submit refund request' }, { status: 500 })
    }

    // Send notification to seller
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('seller_id, product_title')
      .eq('order_id', orderId)
      .limit(1)
      .single()

    if (orderItems) {
      const { data: seller } = await supabase
        .from('users')
        .select('email')
        .eq('id', orderItems.seller_id)
        .single()

      const { data: buyer } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single()

      if (seller && buyer) {
        const buyerName = buyer.first_name && buyer.last_name
          ? `${buyer.first_name} ${buyer.last_name}`.trim()
          : buyer.first_name || 'Buyer'
        const { sendRefundRequestedEmail } = await import('@/lib/emails/notifications')
        await sendRefundRequestedEmail(
          seller.email,
          orderId,
          orderItems.product_title,
          buyerName
        )
      }

      // TODO: Create in-app notification for seller (Feature 06)
    }

    return NextResponse.json({ message: 'Refund request submitted successfully' })
  } catch (error) {
    console.error('Error in POST /api/orders/[orderId]/request-refund:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
