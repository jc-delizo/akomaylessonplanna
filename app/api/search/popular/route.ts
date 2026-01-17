import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/search/popular
 * Get popular searches (top 100)
 * 
 * Returns top 100 most searched queries, cached for 5 minutes
 */
export async function GET(request: NextRequest) {
  try {
    const adminClient = createAdminClient()

    // Get top 100 popular searches
    const { data: popularSearches, error } = await adminClient
      .from('search_queries')
      .select('query_text, search_count, last_searched_at')
      .order('search_count', { ascending: false })
      .limit(100)

    if (error) {
      // If table doesn't exist (PGRST205), return empty array gracefully
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return NextResponse.json(
          { searches: [] },
          {
            headers: {
              'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
            },
          }
        )
      }
      console.error('Error fetching popular searches:', error)
      return NextResponse.json(
        { error: 'Failed to fetch popular searches', searches: [] },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        searches: (popularSearches || []).map((s: any) => ({
          query: s.query_text,
          count: s.search_count,
          last_searched: s.last_searched_at
        }))
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600', // 5 minutes cache
        },
      }
    )
  } catch (error) {
    console.error('Error in GET /api/search/popular:', error)
    return NextResponse.json(
      { error: 'Internal server error', searches: [] },
      { status: 500 }
    )
  }
}
