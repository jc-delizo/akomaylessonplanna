import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { parseBoundedInteger } from '@/lib/utils/query-params'

/**
 * GET /api/products/[id]/reviews
 * Get reviews for a product
 * 
 * Query parameters:
 * - sort: 'newest' | 'highest' | 'lowest' (default: 'newest')
 * - limit: number of reviews to return (default: 10)
 * - offset: pagination offset (default: 0)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams

    // Parse query parameters
    const sort = searchParams.get('sort') || 'newest'
    const limit = parseBoundedInteger(searchParams.get('limit'), 10, 1, 100)
    const offset = parseBoundedInteger(searchParams.get('offset'), 0, 0, 1_000_000)

    // Build query
    let query = supabase
      .from('reviews')
      .select(`
        *,
        buyer:users!reviews_buyer_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `, { count: 'exact' })
      .eq('product_id', id)
      .eq('is_flagged', false) // Only show non-flagged reviews
      .range(offset, offset + limit - 1)

    // Apply sorting
    switch (sort) {
      case 'highest':
        query = query.order('rating', { ascending: false })
        break
      case 'lowest':
        query = query.order('rating', { ascending: true })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    const { data: reviews, error, count } = await query

    if (error) {
      console.error('Error fetching reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Anonymize buyer names
    const anonymizedReviews = reviews?.map((review) => ({
      ...review,
      buyer: review.buyer ? {
        ...review.buyer,
        name: anonymizeName(review.buyer.first_name, review.buyer.last_name), // For backward compatibility
      } : null,
    })) || []

    return NextResponse.json({
      reviews: anonymizedReviews,
      total: count || 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error('Error in GET /api/products/[id]/reviews:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/products/[id]/reviews
 * Create a new review for a product
 * 
 * Body:
 * - rating: number (1-5, required)
 * - comment: string (optional, max 500 chars)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { rating, comment } = body

    // Validate rating
    if (!rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Rating must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Validate comment length
    if (comment && comment.length > 500) {
      return NextResponse.json(
        { error: 'Comment must be 500 characters or less' },
        { status: 400 }
      )
    }

    // Check if product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, seller_id, status')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.status !== 'published') {
      return NextResponse.json(
        { error: 'Cannot review unpublished products' },
        { status: 400 }
      )
    }

    // Check if user already reviewed this product
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('product_id', productId)
      .eq('buyer_id', user.id)
      .single()

    if (existingReview) {
      return NextResponse.json(
        { error: 'You have already reviewed this product' },
        { status: 400 }
      )
    }

    // Check eligibility: user must have purchased AND downloaded
    const { data: eligibilityCheck, error: eligibilityError } = await supabase
      .rpc('check_review_eligibility', {
        p_user_id: user.id,
        p_product_id: productId,
      })

    if (eligibilityError) {
      console.error('Eligibility check error:', eligibilityError)
      return NextResponse.json(
        { error: 'Failed to check review eligibility' },
        { status: 500 }
      )
    }

    if (!eligibilityCheck) {
      return NextResponse.json(
        { 
          error: 'You must purchase and download this product before leaving a review',
          code: 'NOT_ELIGIBLE'
        },
        { status: 403 }
      )
    }

    // Create review
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        product_id: productId,
        buyer_id: user.id,
        rating,
        comment: comment || null,
        verified_purchase: true,
      })
      .select(`
        *,
        buyer:users!reviews_buyer_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        )
      `)
      .single()

    if (reviewError) {
      console.error('Error creating review:', reviewError)
      return NextResponse.json(
        { error: 'Failed to create review' },
        { status: 500 }
      )
    }

    // Check for automatic flagging (profanity, spam, etc.)
    const { autoFlagReview } = await import('@/lib/utils/review-moderation')
    const flagResult = autoFlagReview(comment || null)
    
    if (flagResult) {
      // Flag the review
      await createAdminClient().rpc('auto_flag_review', {
        p_review_id: review.id,
        p_flag_type: flagResult.flagType,
        p_reason: flagResult.reason,
      })
    }

    // Anonymize buyer name
    const anonymizedReview = {
      ...review,
      buyer: review.buyer ? {
        ...review.buyer,
        name: anonymizeName(review.buyer.first_name, review.buyer.last_name), // For backward compatibility
      } : null,
    }

    // Create notification for seller
    try {
      const { createNewReviewNotification } = await import('@/lib/notifications/notification-triggers')
      const { data: productData } = await supabase
        .from('products')
        .select('title, seller_id')
        .eq('id', productId)
        .single()

      if (productData) {
        await createNewReviewNotification(
          productData.seller_id,
          productId,
          productData.title,
          review.buyer ? anonymizeName(review.buyer.first_name, review.buyer.last_name) : 'A buyer',
          rating,
          comment || undefined
        )
      }
    } catch (notificationError) {
      // Don't fail review creation if notification fails
      console.error('Error creating review notification:', notificationError)
    }

    return NextResponse.json({ review: anonymizedReview }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/products/[id]/reviews:', error)
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
