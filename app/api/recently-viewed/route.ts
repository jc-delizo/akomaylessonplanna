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

    // Get recently viewed items with product details (Phase 2: strand, sped_level for ProductCard)
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
          quarter,
          weeks,
          seller:users!products_seller_id_fkey(
            id,
            first_name,
            last_name,
            username
          ),
          grade:grades!products_grade_id_fkey(
            id,
            name
          ),
          subject:subjects!products_subject_id_fkey(
            id,
            name
          ),
          strand:strands!products_strand_id_fkey(
            id,
            name,
            code
          ),
          sped_level:sped_levels!products_sped_level_id_fkey(
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
    const productIds = validItems.map((item) => item.product.id)

    // Attach subject_ids from product_subjects for "Multiple Subjects" on cards
    const productSubjectIds: Record<string, string[]> = {}
    if (productIds.length > 0) {
      const { data: psRows } = await supabase
        .from('product_subjects')
        .select('product_id, subject_id, sort_order')
        .in('product_id', productIds)
        .order('sort_order', { ascending: true })
      for (const row of psRows || []) {
        if (!productSubjectIds[row.product_id]) productSubjectIds[row.product_id] = []
        productSubjectIds[row.product_id].push(row.subject_id)
      }
    }

    const itemsWithSubjectIds = validItems.map((item) => ({
      id: item.id,
      viewed_at: item.viewed_at,
      product: {
        ...item.product,
        subject_ids: productSubjectIds[item.product.id]?.length
          ? productSubjectIds[item.product.id]
          : (item.product.subject_id ? [item.product.subject_id] : []),
      },
    }))

    return NextResponse.json({
      items: itemsWithSubjectIds,
    })
  } catch (error) {
    console.error('Error in GET /api/recently-viewed:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
