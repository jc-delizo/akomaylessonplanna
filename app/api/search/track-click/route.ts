import { NextRequest, NextResponse } from 'next/server'
import { trackSearchClick } from '@/lib/analytics/track-search-impressions'
import { isUuid, sanitizePostgrestSearchTerm } from '@/lib/utils/query-params'

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
    const { product_id, search_term } = body as Record<string, unknown>
    const normalizedSearchTerm = typeof search_term === 'string'
      ? sanitizePostgrestSearchTerm(search_term)
      : ''

    if (typeof product_id !== 'string' || !isUuid(product_id) || !normalizedSearchTerm) {
      return NextResponse.json(
        { error: 'product_id and search_term are required' },
        { status: 400 }
      )
    }

    // Track the click
    await trackSearchClick(product_id, normalizedSearchTerm)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/search/track-click:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
