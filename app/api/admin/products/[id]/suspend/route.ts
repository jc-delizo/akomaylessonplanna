import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { requirePermission, logAdminAction } from '@/lib/middleware/admin-auth'

/**
 * POST /api/admin/products/[id]/suspend
 * Suspend a product
 * 
 * Body:
 * - reason: string (required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requirePermission(request, 'suspend_products')
    if (!authResult.success) {
      return authResult.response
    }

    const { id: productId } = await params
    const supabase = createAdminClient()
    const body: unknown = await request.json()
    const input = body && typeof body === 'object' ? body as Record<string, unknown> : {}
    const reason = typeof input.reason === 'string' ? input.reason.trim() : ''

    if (!reason || reason.length > 2000) {
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
        suspension_reason: reason,
      })
      .eq('id', productId)
      .eq('status', product.status)
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
        reason,
      },
      reason
    )

    // TODO: Send email notification to seller

    return NextResponse.json({ success: true, product: updatedProduct })
  } catch (error) {
    console.error('Error in POST /api/admin/products/[id]/suspend:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
