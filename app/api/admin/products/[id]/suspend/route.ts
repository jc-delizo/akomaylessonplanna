import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, logAdminAction } from '@/lib/middleware/admin-auth'

/**
 * POST /api/admin/products/[id]/suspend
 * Suspend a product
 * 
 * Body:
 * - reason: string (required)
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
    const { reason } = body

    if (!reason || reason.trim().length === 0) {
      return NextResponse.json({ error: 'Suspension reason is required' }, { status: 400 })
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

    // Update product status to suspended
    const { data: updatedProduct, error: updateError } = await supabase
      .from('products')
      .update({
        status: 'suspended',
        suspension_reason: reason.trim(),
        suspended_at: new Date().toISOString(),
      })
      .eq('id', productId)
      .select()
      .single()

    if (updateError) {
      console.error('Error suspending product:', updateError)
      return NextResponse.json({ error: 'Failed to suspend product' }, { status: 500 })
    }

    // Log action
    await logAdminAction(
      authResult.admin.userId,
      'product_suspended',
      'product',
      productId,
      {
        status: { from: product.status, to: 'suspended' },
        reason: reason.trim(),
      },
      reason.trim()
    )

    // TODO: Send email notification to seller

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    console.error('Error in POST /api/admin/products/[id]/suspend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
