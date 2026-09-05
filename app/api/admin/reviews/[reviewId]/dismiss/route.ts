import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/middleware/admin-auth'

/**
 * PUT /api/admin/reviews/[reviewId]/dismiss
 * Dismiss a flagged review (approve review, remove flag)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const authResult = await requirePermission(request, 'dismiss_review_flags')
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = createAdminClient()
    const { reviewId } = await params

    // Get review flag
    const { data: flag, error: flagError } = await supabase
      .from('review_flags')
      .select('*')
      .eq('review_id', reviewId)
      .eq('status', 'pending')
      .single()

    if (flagError || !flag) {
      return NextResponse.json({ error: 'Flagged review not found' }, { status: 404 })
    }

    // Update flag status to dismissed
    const { error: updateError } = await supabase
      .from('review_flags')
      .update({
        status: 'dismissed',
        reviewed_at: new Date().toISOString(),
        reviewed_by: authResult.admin.userId,
      })
      .eq('id', flag.id)

    if (updateError) {
      console.error('Error dismissing flag:', updateError)
      return NextResponse.json({ error: 'Failed to dismiss flag' }, { status: 500 })
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'review_flag_dismissed',
      'review',
      reviewId,
      { flag_id: flag.id },
      'Review flag dismissed - review approved'
    )

    // TODO: Notify seller if toggle enabled

    return NextResponse.json({ success: true, message: 'Review flag dismissed' })
  } catch (error) {
    console.error('Error in PUT /api/admin/reviews/[reviewId]/dismiss:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
