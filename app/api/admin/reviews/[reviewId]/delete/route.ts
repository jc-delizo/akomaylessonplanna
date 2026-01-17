import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'

/**
 * DELETE /api/admin/reviews/[reviewId]
 * Delete a review permanently
 * 
 * Query parameters:
 * - ban_reviewer?: boolean (default: false)
 * - notify_seller?: boolean (default: true)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const { reviewId } = await params
    const searchParams = request.nextUrl.searchParams
    const banReviewer = searchParams.get('ban_reviewer') === 'true'
    const notifySeller = searchParams.get('notify_seller') !== 'false'

    // Get review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Delete review
    const { error: deleteError } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)

    if (deleteError) {
      console.error('Error deleting review:', deleteError)
      return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
    }

    // Ban reviewer if requested (for repeat offenders)
    if (banReviewer) {
      await supabase
        .from('users')
        .update({
          is_banned: true,
          ban_reason: 'Repeated review violations',
        })
        .eq('id', review.buyer_id)
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'review_deleted',
      'review',
      reviewId,
      {
        product_id: review.product_id,
        buyer_id: review.buyer_id,
        ban_reviewer: banReviewer,
      },
      'Review deleted permanently'
    )

    // TODO: Send email notification to seller if notifySeller is true

    return NextResponse.json({
      success: true,
      message: 'Review deleted',
      reviewerBanned: banReviewer,
    })
  } catch (error) {
    console.error('Error in DELETE /api/admin/reviews/[reviewId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
