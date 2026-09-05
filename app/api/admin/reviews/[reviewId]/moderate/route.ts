import { createAdminClient } from '@/lib/supabase/admin'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { hasPermission } from '@/lib/utils/admin-permissions'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/admin/reviews/[reviewId]/moderate
 * Admin decision on flagged review (admin only)
 * 
 * Body:
 * - action: 'approve' | 'delete' (required)
 * - notes?: string (optional)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const { reviewId } = await params
    const supabase = createAdminClient()

    // Parse request body
    const body = await request.json()
    const { action, notes } = body

    if (!action || (action !== 'approve' && action !== 'delete')) {
      return NextResponse.json(
        { error: 'Action must be "approve" or "delete"' },
        { status: 400 }
      )
    }

    const requiredPermission = action === 'delete'
      ? 'delete_reviews'
      : 'dismiss_review_flags'
    if (!hasPermission(authResult.admin.adminRole, requiredPermission)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, is_flagged, buyer_id')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Get all flags for this review
    const { data: flags } = await supabase
      .from('review_flags')
      .select('id')
      .eq('review_id', reviewId)
      .eq('status', 'pending')

    if (action === 'approve') {
      // Restore review (unflag it)
      const { error: updateError } = await supabase
        .from('reviews')
        .update({
          is_flagged: false,
          flag_reason: null,
        })
        .eq('id', reviewId)

      if (updateError) {
        console.error('Error approving review:', updateError)
        return NextResponse.json(
          { error: 'Failed to approve review' },
          { status: 500 }
        )
      }

      // Update all pending flags to approved
      if (flags && flags.length > 0) {
        await supabase
          .from('review_flags')
          .update({
            status: 'approved',
            reviewed_by: authResult.admin.userId,
            reviewed_at: new Date().toISOString(),
          })
          .in('id', flags.map(f => f.id))
      }

      return NextResponse.json({ success: true, action: 'approved' })
    } else {
      // Delete review permanently
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId)

      if (deleteError) {
        console.error('Error deleting review:', deleteError)
        return NextResponse.json(
          { error: 'Failed to delete review' },
          { status: 500 }
        )
      }

      // Update all pending flags to dismissed
      if (flags && flags.length > 0) {
        await supabase
          .from('review_flags')
          .update({
            status: 'dismissed',
            reviewed_by: authResult.admin.userId,
            reviewed_at: new Date().toISOString(),
          })
          .in('id', flags.map(f => f.id))
      }

      // Send notification to buyer that their review was removed
      const { sendReviewRemovedEmail } = await import('@/lib/emails/review-notifications')
      
      // Get buyer info
      const { data: buyerData } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', review.buyer_id)
        .single()
      
      if (buyerData?.email) {
        const buyerName = buyerData.first_name && buyerData.last_name
          ? `${buyerData.first_name} ${buyerData.last_name}`.trim()
          : buyerData.first_name || 'Teacher'
        await sendReviewRemovedEmail(
          buyerData.email,
          buyerName,
          notes || 'violation of our review policy'
        )
      }

      return NextResponse.json({ success: true, action: 'deleted' })
    }
  } catch (error) {
    console.error('Error in PUT /api/admin/reviews/[reviewId]/moderate:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
