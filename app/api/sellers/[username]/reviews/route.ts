import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/sellers/[username]/reviews
 * Get seller's reviews
 * 
 * Query parameters:
 * - limit: number of reviews to return (default: 3 for profile page, all for reviews page)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Get user by username
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('username', username)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Parse query parameters
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? parseInt(limitParam, 10) : null

    // Get products by this seller
    // For now, return empty since products table doesn't exist yet
    // Once products exist, we'll join with reviews table

    // Get seller's product IDs first
    const { data: sellerProducts } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id)

    if (!sellerProducts || sellerProducts.length === 0) {
      return NextResponse.json({
        reviews: [],
        total: 0,
      })
    }

    const productIds = sellerProducts.map(p => p.id)

    // Get reviews for seller's products
    let query = supabase
      .from('reviews')
      .select(`
        *,
        product:products!reviews_product_id_fkey(
          id,
          title,
          cover_image_url,
          seller_id
        ),
        buyer:users!reviews_buyer_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `, { count: 'exact' })
      .in('product_id', productIds)
      .eq('is_flagged', false)
      .order('created_at', { ascending: false })

    if (limit) {
      query = query.limit(limit)
    }

    const { data: reviews, error: reviewsError } = await query

    if (reviewsError) {
      console.error('Error fetching reviews:', reviewsError)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Anonymize buyer names: "Teacher Maria A."
    const anonymizedReviews = reviews?.map((review) => ({
      ...review,
      buyer: {
        ...review.buyer,
        name: anonymizeName(
          review.buyer?.first_name || '',
          review.buyer?.last_name || ''
        ),
      },
    })) || []

    // Get total count separately for accurate pagination
    const { count } = await supabase
      .from('reviews')
      .select('*', { count: 'exact', head: true })
      .in('product_id', productIds)
      .eq('is_flagged', false)

    return NextResponse.json({
      reviews: anonymizedReviews,
      total: count || 0,
    })
  } catch (error) {
    console.error('Error fetching seller reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Anonymize buyer name for privacy
 * Format: "Teacher [First Name] [Last Initial]."
 * Example: "Maria Santos" -> "Teacher Maria S."
 */
function anonymizeName(firstName: string, lastName: string): string {
  const first = (firstName || '').trim()
  const last = (lastName || '').trim()
  
  if (!first) return 'Teacher'
  
  const lastInitial = last ? last[0] : ''
  
  return `Teacher ${first} ${lastInitial ? lastInitial + '.' : ''}`.trim()
}
