import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/seller/analytics/search/opportunities/[productId]
 * Get keyword opportunities for a product (Pro/Pioneer only)
 * 
 * Returns: Keywords with high search volume where product ranks poorly or doesn't appear
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user subscription tier
    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription_tier')
      .eq('id', user.id)
      .single()

    if (userProfile?.subscription_tier !== 'pro' && userProfile?.subscription_tier !== 'pioneer') {
      return NextResponse.json(
        { error: 'This feature is available for Pro and Pioneer sellers only' },
        { status: 403 }
      )
    }

    // Verify product belongs to user
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('seller_id, grade_id, subject_id, title')
      .eq('id', productId)
      .single()

    if (productError || !product || product.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      )
    }

    // Get popular searches related to this product's category
    const { data: popularSearches } = await supabase
      .from('search_queries')
      .select('query_text, search_count')
      .order('search_count', { ascending: false })
      .limit(50)

    // Get searches where this product appears
    const { data: productSearches } = await supabase
      .from('search_analytics')
      .select('search_term, avg_position')
      .eq('product_id', productId)

    const productSearchTerms = new Set(
      (productSearches || []).map((s: any) => s.search_term.toLowerCase())
    )

    // Find opportunities: popular searches where product doesn't appear or ranks poorly
    const opportunities = (popularSearches || [])
      .filter((search: any) => {
        const term = search.query_text.toLowerCase()
        // Check if product appears for this search
        const productSearch = productSearches?.find(
          (s: any) => s.search_term.toLowerCase() === term
        )
        
        // Opportunity if: doesn't appear OR ranks > 10
        return !productSearch || (productSearch.avg_position && parseFloat(productSearch.avg_position) > 10)
      })
      .map((search: any) => {
        const productSearch = productSearches?.find(
          (s: any) => s.search_term.toLowerCase() === search.query_text.toLowerCase()
        )
        
        return {
          keyword: search.query_text,
          search_volume: search.search_count,
          current_ranking: productSearch?.avg_position ? parseFloat(productSearch.avg_position) : null,
          difficulty: 'medium', // Placeholder - would need competitor analysis
          opportunity_score: productSearch ? 50 : 100 // Higher score if product doesn't appear
        }
      })
      .sort((a, b) => b.opportunity_score - a.opportunity_score)
      .slice(0, 10)

    return NextResponse.json({
      opportunities
    })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/search/opportunities/[productId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
