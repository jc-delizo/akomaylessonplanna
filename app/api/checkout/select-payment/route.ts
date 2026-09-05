import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    if (process.env.PAYMENTS_ENABLED !== 'true') {
      return NextResponse.json(
        { error: 'Checkout is temporarily unavailable while payments are being configured' },
        { status: 503 }
      )
    }

    const adminClient = createAdminClient()
    const body = await request.json()
    const { order_id, payment_method, mobile_number } = body

    if (!order_id) {
      return NextResponse.json({ error: 'order_id is required' }, { status: 400 })
    }

    if (!payment_method || !['gcash', 'maya'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'payment_method must be "gcash" or "maya"' },
        { status: 400 }
      )
    }

    const normalizedMobileNumber =
      typeof mobile_number === 'string' ? mobile_number.replace(/[\s-]/g, '') : ''
    if (!/^09\d{9}$/.test(normalizedMobileNumber)) {
      return NextResponse.json(
        { error: 'Valid mobile_number is required' },
        { status: 400 }
      )
    }

    // Verify order belongs to user
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('id, buyer_id, payment_status, payment_expires_at')
      .eq('id', order_id)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    if (order.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (order.payment_status !== 'pending') {
      return NextResponse.json(
        { error: 'Order is not in pending status' },
        { status: 400 }
      )
    }

    // Check if payment expired
    if (order.payment_expires_at) {
      // Parse timestamp as UTC (database stores TIMESTAMP without timezone, but we stored it as UTC ISO string)
      // If the string doesn't end with 'Z', append it to ensure UTC parsing
      const expiresAtStr = order.payment_expires_at.toString()
      const expiresAt = new Date(expiresAtStr.endsWith('Z') ? expiresAtStr : expiresAtStr + 'Z')
      const now = new Date()
      if (expiresAt < now) {
        // Update order to failed
        await adminClient
          .from('orders')
          .update({ payment_status: 'failed' })
          .eq('id', order_id)

        return NextResponse.json(
          { error: 'Payment window has expired. Please create a new order.' },
          { status: 400 }
        )
      }
    }

    // Update order with payment method and mobile number
    const { error: updateError } = await adminClient
      .from('orders')
      .update({
        payment_method: payment_method,
        buyer_mobile_number: normalizedMobileNumber,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order_id)

    if (updateError) {
      console.error('Error updating order:', updateError)
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // TODO: Initiate payment via GCash/Maya API
    // For now, return success - payment will be processed via webhook
    // In production, you would:
    // 1. Call GCash/Maya API to initiate payment
    // 2. Get payment reference/transaction ID
    // 3. Update order with payment_reference
    // 4. Return payment instructions to user

    return NextResponse.json({
      success: true,
      message: 'Payment method selected. Please complete payment in your mobile app.',
      instructions:
        payment_method === 'gcash'
          ? 'Check your GCash app for a push notification to approve the payment.'
          : 'Check your Maya app for an OTP to complete the payment.',
    })
  } catch (error) {
    console.error('Error in POST /api/checkout/select-payment:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
