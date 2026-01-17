import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { trackSearchClick } from '@/lib/analytics/track-search-impressions'

/**
 * POST /api/search/track-click
 * Track when a user clicks on a product from search results
 * 
 * Body:
 * - product_id: UUID (required)
 * - search_term: string (required)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, search_term } = body

    if (!product_id || !search_term) {
      return NextResponse.json(
        { error: 'product_id and search_term are required' },
        { status: 400 }
      )
    }

    // Track the click
    await trackSearchClick(product_id, search_term)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/search/track-click:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
