import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hasValidBearerToken } from '@/lib/security/request-security'

/**
 * POST /api/cron/update-social-proof
 * Refresh product wishlist_count and computed_badge (New, Trending, Bestseller, Popular).
 * Called by Vercel Cron (daily on Hobby, hourly on Pro).
 * Uses DB function refresh_product_social_proof() for a single round-trip.
 */
async function refreshSocialProof(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret) {
      console.error('CRON_SECRET is not configured')
      return NextResponse.json({ error: 'Cron is not configured' }, { status: 503 })
    }

    if (!hasValidBearerToken(request.headers.get('authorization'), cronSecret)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()
    const { error } = await supabase.rpc('refresh_product_social_proof')

    if (error) {
      console.error('Error in refresh_product_social_proof:', error)
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in POST /api/cron/update-social-proof:', error)
    return NextResponse.json(
      {
        error: 'Failed to update social proof',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

/**
 * Vercel Cron invokes routes with GET. POST remains available for manual runs.
 */
export async function GET(request: NextRequest) {
  return refreshSocialProof(request)
}

export async function POST(request: NextRequest) {
  return refreshSocialProof(request)
}
