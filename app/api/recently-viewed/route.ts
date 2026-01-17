import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/recently-viewed
 * Get current user's recently viewed products
 * Query params: ?limit=6 (for homepage)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const filter = searchParams.get('filter') || 'all' // 'all', 'week', 'month'

    // Build date filter
    let dateFilter = new Date()
    if (filter === 'week') {
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    } else if (filter === 'month') {
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    } else {
      // 'all' - no date filter
      dateFilter = new Date(0) // Beginning of time
    }

    // Get recently viewed items with product details
    let query = supabase
      .from('recently_viewed')
      .select(
        `
        id,
        viewed_at,
        product:products!recently_viewed_product_id_fkey(
          id,
          title,
          price,
          cover_image_url,
          seller:users!products_seller_id_fkey(
            id,
            name,
            username
          ),
          grade:grades!products_grade_id_fkey(
            id,
            name
          ),
          subject:subjects!products_subject_id_fkey(
            id,
            name
          )
        )
      `
      )
      .eq('user_id', user.id)
      .gte('viewed_at', dateFilter.toISOString())
      .order('viewed_at', { ascending: false })
      .limit(limit)

    const { data: recentlyViewed, error } = await query

    // #region agent log
    await fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'route.ts:68',message:'Query result',data:{userId:user.id,error:error?.message,errorCode:error?.code,dataLength:recentlyViewed?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    if (error) {
      // Handle missing table gracefully (PGRST205 = table not found)
      if (error.code === 'PGRST205') {
        console.warn('recently_viewed table does not exist. Please run migration 009_feature_06_social_features.sql')
        return NextResponse.json({ items: [] })
      }
      console.error('Error fetching recently viewed:', error)
      return NextResponse.json(
        { error: 'Failed to fetch recently viewed items' },
        { status: 500 }
      )
    }

    // Filter out any items where product was deleted or unpublished
    const validItems = (recentlyViewed || []).filter((item) => item.product !== null)

    return NextResponse.json({
      items: validItems.map((item) => ({
        id: item.id,
        viewed_at: item.viewed_at,
        product: item.product,
      })),
    })
  } catch (error) {
    console.error('Error in GET /api/recently-viewed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
