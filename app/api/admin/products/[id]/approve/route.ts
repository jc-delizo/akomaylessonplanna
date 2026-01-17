import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'

/**
 * POST /api/admin/products/[id]/approve
 * Approve a product (one-click action)
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

    const { id: productId } = await params
    const supabase = await createClient()

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

    // Update product status to published
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      console.error('Error approving product:', updateError)
      return NextResponse.json({ error: 'Failed to approve product' }, { status: 500 })
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'product_approved',
      'product',
      productId,
      { status: { from: 'pending_review', to: 'published' } },
      'Product approved'
    )

    // Send email notification to seller
    try {
      const { sendProductApprovedEmail } = await import('@/lib/emails/product-emails')
      await sendProductApprovedEmail(
        product.seller_id,
        productId,
        product.title
      )
    } catch (emailError) {
      console.error('Error sending product approved email:', emailError)
      // Don't fail the approval if email fails
    }

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    console.error('Error in POST /api/admin/products/[id]/approve:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
