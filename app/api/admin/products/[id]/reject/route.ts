import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/middleware/admin-auth'

/**
 * POST /api/admin/products/[id]/reject
 * Reject a product (requires reason)
 * 
 * Body:
 * - reason: string (required)
 * - allow_resubmission: boolean (default: true)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission(request, 'approve_products')
    if (!authResult.success) {
      return authResult.response
    }

    const { id: productId } = await params
    const supabase = createAdminClient()
    const body: unknown = await request.json()
    const input = body && typeof body === 'object' ? body as Record<string, unknown> : {}
    const reason = typeof input.reason === 'string' ? input.reason.trim() : ''
    const allowResubmission = input.allow_resubmission ?? true

    if (!reason || reason.length > 2000) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
    }

    if (allowResubmission !== true) {
      return NextResponse.json(
        { error: 'Permanent rejection is not supported; suspend the product instead' },
        { status: 400 }
      )
    }

    // Get current product
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.status !== 'pending_review') {
      return NextResponse.json(
        { error: 'Product is not pending review' },
        { status: 400 }
      )
    }

    // Update product status to rejected
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        status: 'rejected',
        rejection_reason: reason,
      })
      .eq('id', productId)
      .eq('status', 'pending_review')
      .select()
      .single()

    if (updateError) {
      console.error('Error rejecting product:', updateError)
      return NextResponse.json({ error: 'Failed to reject product' }, { status: 500 })
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'product_rejected',
      'product',
      productId,
      {
        status: { from: 'pending_review', to: 'rejected' },
        reason,
        allow_resubmission: true,
      },
      reason
    )

    // Send email notification to seller with feedback
    try {
      const { sendProductRejectedEmail } = await import('@/lib/emails/product-emails')
      await sendProductRejectedEmail(
        product.seller_id,
        productId,
        product.title,
        reason
      )
    } catch (emailError) {
      console.error('Error sending product rejected email:', emailError)
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: 'Product rejected. Seller can resubmit.',
    })
  } catch (error) {
    console.error('Error in POST /api/admin/products/[id]/reject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
