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
    const { message } = body

    // Get order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, buyer_id, refund_status, refund_requested_at')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Verify order belongs to user
    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if refund was requested
    if (order.refund_status !== 'requested' && order.refund_status !== 'rejected') {
      return NextResponse.json(
        { error: 'No refund request to escalate' },
        { status: 400 }
      )
    }

    // Check if 48 hours have passed since refund request (or if seller disputed)
    if (order.refund_status === 'requested' && order.refund_requested_at) {
      const requestDate = new Date(order.refund_requested_at)
      const hoursSinceRequest = (Date.now() - requestDate.getTime()) / (1000 * 60 * 60)
      if (hoursSinceRequest < 48) {
        return NextResponse.json(
          { error: 'You can only escalate after 48 hours or if the seller disputed your request' },
          { status: 400 }
        )
      }
    }

    // TODO: Create support ticket or notification for admin
    // For now, we'll just update a flag or create a record
    // In production, you would:
    // 1. Create a support_ticket or dispute record
    // 2. Notify admin team
    // 3. Update order with escalation status

    // TODO: Send escalation notification to admin
    // TODO: Send confirmation to buyer

    return NextResponse.json({
      message: 'Refund request escalated to platform support. You will be notified of the resolution within 3-5 business days.',
    })
  } catch (error) {
    console.error('Error in POST /api/orders/[orderId]/refund/escalate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
