import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/middleware/admin-auth'

/**
 * POST /api/admin/users/[id]/verify-teacher
 * Approve or reject teacher verification
 * 
 * Body:
 * - action: 'approve' | 'reject'
 * - reason?: string (required for reject)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission(request, 'approve_verification')
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const body = await request.json()
    const { action, reason } = body

    if (!action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    if (action === 'reject' && !reason) {
      return NextResponse.json({ error: 'Reason required for rejection' }, { status: 400 })
    }

    const { id } = await params
    const userId = id

    // Get verification record
    const { data: verification, error: verificationError } = await supabase
      .from('teacher_id_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (verificationError || !verification) {
      return NextResponse.json(
        { error: 'Pending verification not found' },
        { status: 404 }
      )
    }

    if (action === 'approve') {
      // Update verification status
      const { error: updateError } = await supabase
        .from('teacher_id_verifications')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: authResult.admin.userId,
        })
        .eq('id', verification.id)

      if (updateError) {
        console.error('Error approving verification:', updateError)
        return NextResponse.json(
          { error: 'Failed to approve verification' },
          { status: 500 }
        )
      }

      // Update user to verified teacher and enable selling
      const { error: userUpdateError } = await supabase
        .from('users')
        .update({
          is_verified_teacher: true,
          can_sell: true,
          role: 'seller',
        })
        .eq('id', userId)

      if (userUpdateError) {
        console.error('Error updating user:', userUpdateError)
        return NextResponse.json(
          { error: 'Failed to update user' },
          { status: 500 }
        )
      }

      // Log action
      await logAdminAction(
        authResult.admin.userId,
        'teacher_verification_approved',
        'user',
        userId,
        { verification_id: verification.id },
        'Teacher verification approved'
      )

      // Send email notification
      try {
        const { sendVerificationApprovedEmail } = await import('@/lib/emails/verification-emails')
        await sendVerificationApprovedEmail(userId)
      } catch (emailError) {
        console.error('Error sending verification approved email:', emailError)
        // Don't fail the approval if email fails
      }

      return NextResponse.json({ success: true, message: 'Verification approved' })
    } else {
      // Reject verification
      const { error: updateError } = await supabase
        .from('teacher_id_verifications')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: authResult.admin.userId,
          rejection_reason: reason,
        })
        .eq('id', verification.id)

      if (updateError) {
        console.error('Error rejecting verification:', updateError)
        return NextResponse.json(
          { error: 'Failed to reject verification' },
          { status: 500 }
        )
      }

      // Log action
      await logAdminAction(
        authResult.admin.userId,
        'teacher_verification_rejected',
        'user',
        userId,
        { verification_id: verification.id, reason },
        reason
      )

      // Send email notification with reason
      try {
        const { sendVerificationRejectedEmail } = await import('@/lib/emails/verification-emails')
        await sendVerificationRejectedEmail(userId, reason)
      } catch (emailError) {
        console.error('Error sending verification rejected email:', emailError)
        // Don't fail the rejection if email fails
      }

      return NextResponse.json({ success: true, message: 'Verification rejected' })
    }
  } catch (error) {
    console.error('Error in POST /api/admin/users/[id]/verify-teacher:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
