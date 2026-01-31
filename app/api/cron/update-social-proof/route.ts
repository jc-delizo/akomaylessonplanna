import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/cron/update-social-proof
 * Refresh product wishlist_count and computed_badge (New, Trending, Bestseller, Popular).
 * Called by Vercel Cron (daily on Hobby, hourly on Pro).
 * Uses DB function refresh_product_social_proof() for a single round-trip.
 */
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
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
 * GET /api/cron/update-social-proof
 * Light status check (e.g. last run not stored; returns OK if DB is reachable).
 */
export async function GET() {
  try {
    const supabase = createAdminClient()
    const { count } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .not('computed_badge', 'is', null)
      .limit(1)

    return NextResponse.json({
      ok: true,
      products_with_badge: count ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error in GET /api/cron/update-social-proof:', error)
    return NextResponse.json(
      {
        error: 'Status check failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
