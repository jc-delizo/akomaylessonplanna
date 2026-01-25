import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/reviews/[reviewId]
 * Get a single review by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params
    const supabase = await createClient()

    const { data: review, error } = await supabase
      .from('reviews')
      .select(`
        *,
        buyer:users!reviews_buyer_id_fkey(
          id,
          first_name,
          last_name,
          avatar_url
        ),
        product:products!reviews_product_id_fkey(
          id,
          title,
          cover_image_url
        )
      `)
      .eq('id', reviewId)
      .single()

    if (error || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Anonymize buyer name
    const anonymizedReview = {
      ...review,
      buyer: review.buyer ? {
        ...review.buyer,
        name: anonymizeName(review.buyer.first_name, review.buyer.last_name), // For backward compatibility
      } : null,
    }

    return NextResponse.json({ review: anonymizedReview })
  } catch (error) {
    console.error('Error in GET /api/reviews/[reviewId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/reviews/[reviewId]
 * Edit a review (within 7 days only)
 * 
 * Body:
 * - rating?: number (1-5)
 * - comment?: string (max 500 chars)
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

    // Get existing review
    const { data: existingReview, error: fetchError } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single()

    if (fetchError || !existingReview) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Check ownership
    if (existingReview.buyer_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check 7-day edit window
    const createdAt = new Date(existingReview.created_at)
    const now = new Date()
    const daysSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24)

    if (daysSinceCreation > 7) {
      return NextResponse.json(
        { error: 'Review can only be edited within 7 days of posting' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { rating, comment } = body

    // Build update object
    const updates: {
      rating?: number
      comment?: string | null
      is_edited?: boolean
      updated_at?: string
    } = {
      is_edited: true,
      updated_at: new Date().toISOString(),
    }

    if (rating !== undefined) {
      if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Rating must be between 1 and 5' },
          { status: 400 }
        )
      }
      updates.rating = rating
    }

    if (comment !== undefined) {
      if (comment && comment.length > 500) {
        return NextResponse.json(
          { error: 'Comment must be 500 characters or less' },
          { status: 400 }
        )
      }
      updates.comment = comment || null
    }

    // Update review
    const { data: updatedReview, error: updateError } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', reviewId)
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

    if (updateError) {
      console.error('Error updating review:', updateError)
      return NextResponse.json(
        { error: 'Failed to update review' },
        { status: 500 }
      )
    }

    // Anonymize buyer name
    const anonymizedReview = {
      ...updatedReview,
      buyer: updatedReview.buyer ? {
        ...updatedReview.buyer,
        name: anonymizeName(
          updatedReview.buyer.first_name || '',
          updatedReview.buyer.last_name || ''
        ),
      } : null,
    }

    return NextResponse.json({ review: anonymizedReview })
  } catch (error) {
    console.error('Error in PUT /api/reviews/[reviewId]:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Anonymize buyer name for privacy
 */
function anonymizeName(firstName: string, lastName: string): string {
  const first = (firstName || '').trim()
  const last = (lastName || '').trim()
  
  if (!first) return 'Teacher'
  
  const lastInitial = last ? last[0] : ''
  
  return `Teacher ${first} ${lastInitial ? lastInitial + '.' : ''}`.trim()
}
