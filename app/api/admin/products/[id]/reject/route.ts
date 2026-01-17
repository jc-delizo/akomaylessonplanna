import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'

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
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const productId = params.id
    const body = await request.json()
    const { reason, allow_resubmission = true } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Rejection reason is required' }, { status: 400 })
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
        rejection_reason: reason.trim(),
        // Note: allow_resubmission is tracked in product_updates table
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      console.error('Error rejecting product:', updateError)
      return NextResponse.json({ error: 'Failed to reject product' }, { status: 500 })
    }

    // Create product update record for resubmission tracking
    if (allow_resubmission) {
      await supabase.from('product_updates').insert({
        product_id: productId,
        update_type: 'rejection',
        notes: reason.trim(),
        created_by: product.seller_id,
      })
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'product_rejected',
      'product',
      productId,
      {
        status: { from: 'pending_review', to: 'rejected' },
        reason: reason.trim(),
        allow_resubmission,
      },
      reason.trim()
    )

    // Send email notification to seller with feedback
    try {
      const { sendProductRejectedEmail } = await import('@/lib/emails/product-emails')
      await sendProductRejectedEmail(
        product.seller_id,
        productId,
        product.title,
        reason.trim()
      )
    } catch (emailError) {
      console.error('Error sending product rejected email:', emailError)
      // Don't fail the rejection if email fails
    }

    return NextResponse.json({
      success: true,
      product: updatedProduct,
      message: allow_resubmission
        ? 'Product rejected. Seller can resubmit.'
        : 'Product rejected permanently.',
    })
  } catch (error) {
    console.error('Error in POST /api/admin/products/[id]/reject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
