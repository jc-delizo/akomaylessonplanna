import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/search/recent
 * Get recent searches for logged-in user
 * 
 * Returns last 10 searches for the authenticated user
 * For anonymous users, returns empty array (use localStorage on client)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Anonymous user - return empty (client should use localStorage)
      return NextResponse.json({ searches: [] })
    }

    // Get user's search history
    const { data: searchHistory, error } = await supabase
      .from('user_search_history')
      .select('query_text, searched_at')
      .eq('user_id', user.id)
      .order('searched_at', { ascending: false })
      .limit(10)

    if (error) {
      // If table doesn't exist (PGRST205), return empty array gracefully
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return NextResponse.json({ searches: [] })
      }
      console.error('Error fetching recent searches:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recent searches', searches: [] },
        { status: 500 }
      )
    }

    return NextResponse.json({
      searches: (searchHistory || []).map((s: any) => ({
        query: s.query_text,
        searched_at: s.searched_at
      }))
    })
  } catch (error) {
    console.error('Error in GET /api/search/recent:', error)
    return NextResponse.json(
      { error: 'Internal server error', searches: [] },
      { status: 500 }
    )
  }
}
