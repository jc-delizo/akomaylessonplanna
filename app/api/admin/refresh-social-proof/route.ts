import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/admin/refresh-social-proof
 * Manually trigger refresh of product wishlist_count and computed_badge.
 * Admin-only; uses session auth (no CRON_SECRET).
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
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
    console.error('Error in POST /api/admin/refresh-social-proof:', error)
    return NextResponse.json(
      {
        error: 'Failed to refresh social proof',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
