import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NextRequest, NextResponse } from 'next/server'
import { toPromise } from '@/lib/utils/supabase-promise'

/**
 * POST /api/search/track
 * Track a search query for analytics
 * 
 * Body:
 * - query: search query text (required)
 * 
 * Tracks:
 * - Updates search_queries table (increments count)
 * - Saves to user_search_history if user is logged in
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const adminClient = createAdminClient()

    // Track in search_queries table (for popular searches)
    try {
      await toPromise(adminClient.rpc('upsert_search_query', {
        p_query_text: query.trim()
      })).catch(async () => {
        // Fallback: Direct upsert if RPC doesn't exist
        await adminClient
          .from('search_queries')
          .upsert({
            query_text: query.trim(),
            search_count: 1,
            last_searched_at: new Date().toISOString()
          }, {
            onConflict: 'query_text',
            ignoreDuplicates: false
          })
      })
    } catch (err) {
      console.error('Error tracking search query:', err)
      // Don't fail the request if tracking fails
    }

    // Save to user search history if logged in
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await toPromise(supabase.rpc('upsert_user_search_history', {
          p_user_id: user.id,
          p_query_text: query.trim()
        })).catch(async () => {
          // Fallback: Direct upsert if RPC doesn't exist
          await supabase
            .from('user_search_history')
            .upsert({
              user_id: user.id,
              query_text: query.trim(),
              searched_at: new Date().toISOString()
            }, {
              onConflict: 'user_id,query_text',
              ignoreDuplicates: false
            })
        })
      }
    } catch (err) {
      console.error('Error saving user search history:', err)
      // Don't fail the request if history save fails
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/search/track:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
