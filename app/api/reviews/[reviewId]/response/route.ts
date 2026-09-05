import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * PUT /api/reviews/[reviewId]/response
 * Seller responds to a review
 * 
 * Body:
 * - response: string (max 500 chars, required)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params
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
    const { response } = body

    if (!response || typeof response !== 'string') {
      return NextResponse.json(
        { error: 'Response is required' },
        { status: 400 }
      )
    }

    if (response.length > 500) {
      return NextResponse.json(
        { error: 'Response must be 500 characters or less' },
        { status: 400 }
      )
    }

    // Get review with product info
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select(`
        *,
        product:products!reviews_product_id_fkey(
          id,
          seller_id,
          title
        )
      `)
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check if user is the seller of this product
    if (review.product.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Only the seller can respond to reviews for their products' },
        { status: 403 }
      )
    }

    // Update review with seller response
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update({
        seller_response: response,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select(`
        *,
        product:products!reviews_product_id_fkey(
          id,
          title
        )
      `)
      .single()

    if (updateError) {
      console.error('Error updating review response:', updateError)
      return NextResponse.json(
        { error: 'Failed to add response' },
        { status: 500 }
      )
    }

    // Email is private profile data, so fetch it only after ownership has been verified.
    const { data: buyer } = await createAdminClient()
      .from('users')
      .select('id, first_name, last_name, email')
      .eq('id', updatedReview.buyer_id)
      .single()

    const responseReview = { ...updatedReview, buyer }

    // Send notification to buyer (in-app + email)
    const { sendSellerResponseNotificationEmail } = await import('@/lib/emails/review-notifications')
    
    if (buyer?.email) {
      await sendSellerResponseNotificationEmail({
        buyerName: buyer.first_name && buyer.last_name
          ? `${buyer.first_name} ${buyer.last_name}`.trim()
          : buyer.first_name || 'Teacher',
        buyerEmail: buyer.email,
        sellerName: (user.user_metadata?.first_name && user.user_metadata?.last_name
          ? `${user.user_metadata.first_name} ${user.user_metadata.last_name}`.trim()
          : user.user_metadata?.first_name) || 'Seller',
        productTitle: updatedReview.product.title,
        buyerReviewComment: updatedReview.comment || undefined,
        sellerResponse: response,
        productLink: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/products/${updatedReview.product.id}`,
      })
    }

    return NextResponse.json({ review: responseReview })
  } catch (error) {
    console.error('Error in PUT /api/reviews/[reviewId]/response:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
