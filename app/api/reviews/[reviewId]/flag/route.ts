import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/reviews/[reviewId]/flag
 * Flag a review for moderation
 * 
 * Body:
 * - reason: string (required)
 * - description?: string (optional)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params
    const supabase = await createClient()

    // Get authenticated user (optional - anyone can flag)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Parse request body
    const body = await request.json()
    const { reason, description } = body

    if (!reason || typeof reason !== 'string') {
      return NextResponse.json(
        { error: 'Reason is required' },
        { status: 400 }
      )
    }

    // Check if review exists
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, is_flagged')
      .eq('id', reviewId)
      .single()

    if (reviewError || !review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 })
    }

    // Create flag record
    const { data: flag, error: flagError } = await supabase
      .from('review_flags')
      .insert({
        review_id: reviewId,
        flag_type: 'manual_report',
        flag_source: 'manual',
        reporter_id: user?.id || null,
        reason: reason,
        status: 'pending',
      })
      .select()
      .single()

    if (flagError) {
      console.error('Error creating flag:', flagError)
      return NextResponse.json(
        { error: 'Failed to flag review' },
        { status: 500 }
      )
    }

    // If review is not already flagged, flag it
    if (!review.is_flagged) {
      await supabase
        .from('reviews')
        .update({
          is_flagged: true,
          flag_reason: reason,
        })
        .eq('id', reviewId)
    }

    return NextResponse.json({ flag }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/reviews/[reviewId]/flag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
