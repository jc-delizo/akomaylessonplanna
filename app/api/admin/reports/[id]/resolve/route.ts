import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'
import { hasPermission } from '@/lib/utils/admin-permissions'
import { createNotification } from '@/lib/notifications/create-notification'

type ResolutionType =
  | 'dismissed'
  | 'user_banned'
  | 'user_warned'
  | 'product_suspended'
  | 'review_deleted'

/**
 * POST /api/admin/reports/[id]/resolve
 * Resolve a report with context-aware actions
 *
 * Body:
 * - resolution_type: 'dismissed' | 'user_banned' | 'user_warned' | 'product_suspended' | 'review_deleted'
 * - resolution_notes: string (required)
 * - user_id?: string (for user_banned, user_warned)
 * - product_id?: string (for product_suspended)
 * - review_id?: string (for review_deleted)
 * - reason?: string (for ban/warn/suspend - can reuse resolution_notes)
 * - ban_reviewer?: boolean (for review_deleted)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    if (!hasPermission(authResult.admin.adminRole, 'resolve_reports')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const { id: reportId } = await params
    const supabase = createAdminClient()
    const body = await request.json()
    const {
      resolution_type,
      resolution_notes,
      user_id,
      product_id,
      review_id,
      reason,
      ban_reviewer,
    } = body

    if (!resolution_type || !resolution_notes || !String(resolution_notes).trim()) {
      return NextResponse.json(
        { error: 'resolution_type and resolution_notes are required' },
        { status: 400 }
      )
    }

    const validTypes: ResolutionType[] = [
      'dismissed',
      'user_banned',
      'user_warned',
      'product_suspended',
      'review_deleted',
    ]
    if (!validTypes.includes(resolution_type)) {
      return NextResponse.json({ error: 'Invalid resolution_type' }, { status: 400 })
    }

    const actionPermission = resolution_type === 'user_banned'
      ? 'ban_user'
      : resolution_type === 'user_warned'
        ? 'warn_user'
        : resolution_type === 'product_suspended'
          ? 'suspend_products'
          : resolution_type === 'review_deleted'
            ? 'delete_reviews'
            : 'resolve_reports'

    if (!hasPermission(authResult.admin.adminRole, actionPermission)) {
      return NextResponse.json({ error: 'Insufficient permissions for this resolution' }, { status: 403 })
    }

    if (ban_reviewer && !hasPermission(authResult.admin.adminRole, 'ban_user')) {
      return NextResponse.json({ error: 'Insufficient permission to ban reviewer' }, { status: 403 })
    }

    // Get report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .select('*')
      .eq('id', reportId)
      .single()

    if (reportError || !report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    const actionReason = reason || resolution_notes

    // Perform action based on resolution_type
    if (resolution_type === 'user_banned') {
      const targetUserId = user_id || report.reported_item_id
      if (!targetUserId) {
        return NextResponse.json({ error: 'user_id required for user_banned' }, { status: 400 })
      }
      const { data: targetUser } = await supabase
        .from('users')
        .select('role')
        .eq('id', targetUserId)
        .single()
      if (!targetUser) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
      }
      if (targetUser.role === 'admin' || targetUserId === authResult.admin.userId) {
        return NextResponse.json(
          { error: 'Administrator accounts cannot be banned through report resolution' },
          { status: 403 }
        )
      }
      const { error: banError } = await supabase
        .from('users')
        .update({ is_banned: true, ban_reason: actionReason })
        .eq('id', targetUserId)
      if (banError) {
        return NextResponse.json({ error: 'Failed to ban user' }, { status: 500 })
      }
      await logAdminAction(
        authResult.admin.userId,
        'user_banned',
        'user',
        targetUserId,
        { report_id: reportId, ban_reason: actionReason },
        actionReason
      )
    } else if (resolution_type === 'user_warned') {
      const targetUserId = user_id || report.reported_item_id
      if (!targetUserId) {
        return NextResponse.json({ error: 'user_id required for user_warned' }, { status: 400 })
      }
      await createNotification({
        user_id: targetUserId,
        type: 'admin_warning',
        title: 'Administrative Warning',
        message: actionReason,
      })
      await logAdminAction(
        authResult.admin.userId,
        'user_warned',
        'user',
        targetUserId,
        { report_id: reportId, reason: actionReason },
        actionReason
      )
    } else if (resolution_type === 'product_suspended') {
      const targetProductId = product_id || report.reported_item_id
      if (!targetProductId) {
        return NextResponse.json({ error: 'product_id required for product_suspended' }, { status: 400 })
      }
      const { data: product } = await supabase
        .from('products')
        .select('status')
        .eq('id', targetProductId)
        .single()
      const { error: suspendError } = await supabase
        .from('products')
        .update({
          status: 'suspended',
          suspension_reason: actionReason,
        })
        .eq('id', targetProductId)
      if (suspendError) {
        return NextResponse.json({ error: 'Failed to suspend product' }, { status: 500 })
      }
      await logAdminAction(
        authResult.admin.userId,
        'product_suspended',
        'product',
        targetProductId,
        { report_id: reportId, status: { from: product?.status, to: 'suspended' }, reason: actionReason },
        actionReason
      )
    } else if (resolution_type === 'review_deleted') {
      const targetReviewId = review_id || report.reported_item_id
      if (!targetReviewId) {
        return NextResponse.json({ error: 'review_id required for review_deleted' }, { status: 400 })
      }
      const { data: review } = await supabase
        .from('reviews')
        .select('buyer_id, product_id')
        .eq('id', targetReviewId)
        .single()
      const { error: deleteError } = await supabase
        .from('reviews')
        .delete()
        .eq('id', targetReviewId)
      if (deleteError) {
        return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 })
      }
      if (ban_reviewer && review?.buyer_id) {
        const { data: reviewer } = await supabase
          .from('users')
          .select('role')
          .eq('id', review.buyer_id)
          .single()
        if (reviewer?.role !== 'admin') {
          await supabase
            .from('users')
            .update({ is_banned: true, ban_reason: 'Repeated review violations' })
            .eq('id', review.buyer_id)
        }
      }
      await logAdminAction(
        authResult.admin.userId,
        'review_deleted',
        'review',
        targetReviewId,
        { report_id: reportId, ban_reviewer: !!ban_reviewer },
        actionReason
      )
    }
    // dismissed: no action

    // Update report
    const reportStatus = resolution_type === 'dismissed' ? 'dismissed' : 'resolved'
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        status: reportStatus,
        resolved_by: authResult.admin.userId,
        resolved_at: new Date().toISOString(),
        resolution_notes: resolution_notes.trim(),
        resolution_type,
      })
      .eq('id', reportId)

    if (updateError) {
      console.error('Error updating report:', updateError)
      return NextResponse.json({ error: 'Failed to update report' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Report resolved successfully' })
  } catch (error) {
    console.error('Error in POST /api/admin/reports/[id]/resolve:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
