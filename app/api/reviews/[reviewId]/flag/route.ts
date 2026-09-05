import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

    // Review reports require an account so they can be deduplicated and audited.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { reason } = body

    if (
      typeof reason !== 'string' ||
      reason.trim().length === 0 ||
      reason.length > 1000
    ) {
      return NextResponse.json(
        { error: 'Reason must be between 1 and 1000 characters' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()
    const { data: flagId, error: flagError } = await adminClient.rpc('report_review', {
      p_review_id: reviewId,
      p_reporter_id: user.id,
      p_reason: reason.trim(),
    })

    if (flagError) {
      console.error('Error creating flag:', flagError)
      if (flagError.code === 'P0002') {
        return NextResponse.json({ error: 'Review not found' }, { status: 404 })
      }
      return NextResponse.json(
        { error: 'Failed to flag review' },
        { status: 500 }
      )
    }

    return NextResponse.json({ flag: { id: flagId } }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/reviews/[reviewId]/flag:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
