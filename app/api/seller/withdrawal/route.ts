import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { parseAmountToCentavos } from '@/lib/security/request-security'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminClient = createAdminClient()

    // Verify user is a seller
    const { data: userData } = await adminClient
      .from('users')
      .select('role, can_sell, gcash_number, maya_number')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { amount, payment_method } = body

    const amountCentavos = parseAmountToCentavos(amount)
    if (amountCentavos === null || amountCentavos < 50_000) {
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

    // Get payment number from user profile
    const paymentNumber =
      payment_method === 'gcash' ? userData.gcash_number : userData.maya_number

    if (!paymentNumber) {
      return NextResponse.json(
        { error: `Please set your ${payment_method === 'gcash' ? 'GCash' : 'Maya'} number in your profile settings` },
        { status: 400 }
      )
    }

    if (!/^09\d{9}$/.test(paymentNumber)) {
      return NextResponse.json(
        { error: `Please set a valid ${payment_method === 'gcash' ? 'GCash' : 'Maya'} number in your profile settings` },
        { status: 400 }
      )
    }

    // Reserve the balance and create the request in one locked transaction.
    const normalizedAmount = amountCentavos / 100
    const { data: reservation, error: withdrawalError } = await adminClient.rpc(
      'request_withdrawal',
      {
        p_seller_id: user.id,
        p_amount: normalizedAmount,
        p_payment_method: payment_method,
        p_payment_number: paymentNumber,
      }
    )

    if (withdrawalError) {
      console.error('Error creating withdrawal request:', withdrawalError)
      if (withdrawalError.message.includes('insufficient_funds')) {
        return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
      }
      return NextResponse.json(
        { error: 'Failed to create withdrawal request' },
        { status: 500 }
      )
    }

    const reserved = Array.isArray(reservation) ? reservation[0] : null
    if (!reserved?.withdrawal_id) {
      return NextResponse.json({ error: 'Failed to create withdrawal request' }, { status: 500 })
    }

    const { data: withdrawal, error: fetchError } = await adminClient
      .from('withdrawal_requests')
      .select('*')
      .eq('id', reserved.withdrawal_id)
      .single()

    if (fetchError || !withdrawal) {
      console.error('Error loading created withdrawal request:', fetchError)
      return NextResponse.json({ error: 'Failed to load withdrawal request' }, { status: 500 })
    }

    // TODO: Process the pending request via a verified GCash/Maya disbursement integration.
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
        withdrawal,
        message: 'Withdrawal request submitted. Processing time: 1-3 business days.',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/seller/withdrawal:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
