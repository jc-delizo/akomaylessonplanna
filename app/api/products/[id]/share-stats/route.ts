import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/products/[id]/share-stats
 * Get share statistics for a product (seller or admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify product exists and user is seller or admin
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if user is seller or admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    const isSeller = user.id === product.seller_id
    const isAdmin = userData?.role === 'admin'

    if (!isSeller && !isAdmin) {
      return NextResponse.json(
        { error: 'Forbidden. Only seller or admin can view share stats' },
        { status: 403 }
      )
    }

    // Get share statistics
    const { data: shares, error: sharesError } = await supabase
      .from('product_shares')
      .select('platform')
      .eq('product_id', productId)

    if (sharesError) {
      console.error('Error fetching share stats:', sharesError)
      return NextResponse.json(
        { error: 'Failed to fetch share statistics' },
        { status: 500 }
      )
    }

    // Count by platform
    const stats = {
      facebook: 0,
      messenger: 0,
      copy_link: 0,
      total: shares?.length || 0,
    }

    shares?.forEach((share) => {
      if (share.platform === 'facebook') stats.facebook++
      else if (share.platform === 'messenger') stats.messenger++
      else if (share.platform === 'copy_link') stats.copy_link++
    })

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error in GET /api/products/[id]/share-stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
