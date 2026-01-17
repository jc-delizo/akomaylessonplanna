import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin, logAdminAction } from '@/lib/middleware/admin-auth'

/**
 * POST /api/admin/financials/withdrawals/[id]/process
 * Process a withdrawal request manually (Super Admin only)
 * 
 * This initiates GCash/Maya Disbursement API call
 * Body:
 * - payment_reference?: string (if processing offline)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireSuperAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const withdrawalId = params.id
    const body = await request.json()

    // Get withdrawal request
    const { data: withdrawal, error: withdrawalError } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', withdrawalId)
      .single()

    if (withdrawalError || !withdrawal) {
      return NextResponse.json({ error: 'Withdrawal request not found' }, { status: 404 })
    }

    if (withdrawal.status !== 'pending') {
      return NextResponse.json(
        { error: 'Withdrawal is not pending' },
        { status: 400 }
      )
    }

    // Update status to processing
    const { error: updateError } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'processing',
        processed_at: new Date().toISOString(),
      })
      .eq('id', withdrawalId)

    if (updateError) {
      console.error('Error updating withdrawal:', updateError)
      return NextResponse.json({ error: 'Failed to update withdrawal' }, { status: 500 })
    }

    // TODO: Integrate with GCash/Maya Disbursement API
    // For now, simulate processing
    // In production, this would:
    // 1. Call GCash/Maya API with withdrawal details
    // 2. Wait for webhook confirmation
    // 3. Update status to 'completed' or 'failed' based on response

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'withdrawal_processed',
      'withdrawal',
      withdrawalId,
      {
        status: { from: 'pending', to: 'processing' },
        amount: withdrawal.amount,
        payment_method: withdrawal.payment_method,
      },
      'Withdrawal processing initiated'
    )

    // TODO: Send email notification to seller

    return NextResponse.json({
      success: true,
      message: 'Withdrawal processing initiated',
      withdrawal,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/financials/withdrawals/[id]/process:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
