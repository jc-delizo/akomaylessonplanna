import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/recommendations/trending
 * Get trending products
 * 
 * Returns products trending based on views + sales in last 7 days
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get trending products (high views + sales, recent)
    const { data: trending, error } = await supabase
      .from('products')
      .select(`
        *,
        seller:users!products_seller_id_fkey(
          id,
          first_name,
          last_name,
          username,
          avatar_url,
          is_verified_teacher
        ),
        grade:grades!products_grade_id_fkey(
          id,
          name
        ),
        subject:subjects!products_subject_id_fkey(
          id,
          name,
          code
        )
      `)
      .eq('status', 'published')
      .gte('published_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('views_count', { ascending: false })
      .order('sales_count', { ascending: false })
      .limit(8)

    if (error) {
      throw error
    }

    return NextResponse.json({
      products: trending || []
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/recommendations/trending:', error)
    return NextResponse.json(
      { error: 'Internal server error', products: [] },
      { status: 500 }
    )
  }
}
