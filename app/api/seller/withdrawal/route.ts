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

    // Verify user is a seller
    const { data: userData } = await supabase
      .from('users')
      .select('role, can_sell, gcash_number, maya_number')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { amount, payment_method } = body

    if (!amount || isNaN(amount) || amount < 500) {
      return NextResponse.json(
        { error: 'Minimum withdrawal amount is ₱500' },
        { status: 400 }
      )
    }

    if (!payment_method || !['gcash', 'maya'].includes(payment_method)) {
      return NextResponse.json(
        { error: 'payment_method must be "gcash" or "maya"' },
        { status: 400 }
      )
    }

    // Get available balance (calculate directly instead of making HTTP request)
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('net_earnings, created_at, order:orders!order_items_order_id_fkey(payment_status, completed_at)')
      .eq('seller_id', user.id)

    if (!orderItems) {
      return NextResponse.json({ error: 'Failed to calculate balance' }, { status: 500 })
    }

    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    let availableBalance = 0
    for (const item of orderItems) {
      if (item.order?.payment_status === 'completed') {
        const itemDate = new Date(item.order.completed_at || item.created_at)
        if (itemDate < threeDaysAgo) {
          availableBalance += parseFloat(item.net_earnings.toString())
        }
      }
    }

    // Subtract withdrawn amounts
    const { data: withdrawals } = await supabase
      .from('withdrawal_requests')
      .select('amount, status')
      .eq('seller_id', user.id)
      .in('status', ['processing', 'completed'])

    if (withdrawals) {
      const withdrawnAmount = withdrawals
        .filter((w) => w.status === 'completed')
        .reduce((sum, w) => sum + parseFloat(w.amount.toString()), 0)

      availableBalance = Math.max(0, availableBalance - withdrawnAmount)
    }

    const earnings = { available_balance: availableBalance }

    if (amount > earnings.available_balance) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      )
    }

    // Get payment number from user profile
    const paymentNumber =
      payment_method === 'gcash' ? userData.gcash_number : userData.maya_number

    if (!paymentNumber) {
      return NextResponse.json(
        { error: `Please set your ${payment_method === 'gcash' ? 'GCash' : 'Maya'} number in your profile settings` },
        { status: 400 }
      )
    }

    // Create withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .insert({
        seller_id: user.id,
        amount: amount,
        payment_method: payment_method,
        payment_number: paymentNumber,
        status: 'processing',
      })
      .select()
      .single()

    if (withdrawalError) {
      console.error('Error creating withdrawal request:', withdrawalError)
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      )
    }

    // TODO: Process withdrawal via GCash/Maya Disbursement API
    // For now, we'll just create the request
    // In production, you would:
    // 1. Call GCash/Maya Disbursement API
    // 2. Get transaction reference
    // 3. Update withdrawal with transaction_reference
    // 4. Update status to 'completed' or 'failed' based on API response
    // 5. Send withdrawal complete email when status is 'completed'

    // When withdrawal is processed (via webhook or background job):
    // const { sendWithdrawalCompleteEmail } = await import('@/lib/emails/notifications')
    // await sendWithdrawalCompleteEmail(userData.email, amount, payment_method)

    return NextResponse.json(
      {
        withdrawal: withdrawal,
        message: 'Withdrawal request submitted. Processing time: 1-3 business days.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/seller/withdrawal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
