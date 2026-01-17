import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/seller/reviews
 * Get reviews for seller's products
 * 
 * Query parameters:
 * - product_id?: UUID (filter by product)
 * - rating?: number (1-5, filter by rating)
 * - status?: 'all' | 'unresponded' (default: 'all')
 * - limit: number (default: 20)
 * - offset: number (default: 0)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a seller
    const { data: userData } = await supabase
      .from('users')
      .select('role, can_sell')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'seller' && !userData.can_sell)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse query parameters
    const productId = searchParams.get('product_id')
    const rating = searchParams.get('rating') ? parseInt(searchParams.get('rating')!, 10) : null
    const status = searchParams.get('status') || 'all'
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build query - first get seller's product IDs
    const { data: sellerProducts } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id)

    if (!sellerProducts || sellerProducts.length === 0) {
      return NextResponse.json({
        reviews: [],
        total: 0,
        responseRate: 0,
        limit,
        offset,
      })
    }

    const productIds = sellerProducts.map(p => p.id)

    // Build query
    let query = supabase
      .from('reviews')
      .select(`
        *,
        buyer:users!reviews_buyer_id_fkey(
          id,
          name,
          avatar_url
        ),
        product:products!reviews_product_id_fkey(
          id,
          title,
          cover_image_url,
          seller_id
        )
      `, { count: 'exact' })
      .in('product_id', productIds) // Only reviews for seller's products
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false })

    // Apply filters
    if (productId) {
      query = query.eq('product_id', productId)
    }

    if (rating) {
      query = query.eq('rating', rating)
    }

    if (status === 'unresponded') {
      query = query.is('seller_response', null)
    }

    const { data: reviews, error, count } = await query

    if (error) {
      console.error('Error fetching seller reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Calculate response rate
    const totalReviews = count || 0
    const respondedReviews = reviews?.filter(r => r.seller_response).length || 0
    const responseRate = totalReviews > 0 ? (respondedReviews / totalReviews) * 100 : 0

    // Anonymize buyer names
    const anonymizedReviews = reviews?.map((review) => ({
      ...review,
      buyer: review.buyer ? {
        ...review.buyer,
        name: anonymizeName(review.buyer.name),
      } : null,
    })) || []

    return NextResponse.json({
      reviews: anonymizedReviews,
      total: count || 0,
      responseRate: Math.round(responseRate * 100) / 100,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error in GET /api/seller/reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Anonymize buyer name for privacy
 */
function anonymizeName(fullName: string): string {
  if (!fullName) return 'Teacher'
  
  const parts = fullName.trim().split(' ')
  if (parts.length === 0) return 'Teacher'
  
  const firstName = parts[0]
  const lastInitial = parts.length > 1 ? parts[parts.length - 1][0] : ''
  
  return `Teacher ${firstName} ${lastInitial ? lastInitial + '.' : ''}`.trim()
}
