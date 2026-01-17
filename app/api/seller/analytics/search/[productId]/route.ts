import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/seller/analytics/search/[productId]
 * Get search analytics overview for a product
 * 
 * Returns: Total impressions, clicks, CTR, average ranking
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

    // Verify product belongs to user
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('seller_id')
      .eq('id', productId)
      .single()

    if (productError || !product || product.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      )
    }

    // Get search analytics summary (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: analytics, error: analyticsError } = await supabase
      .from('search_analytics')
      .select('impressions, clicks, avg_position')
      .eq('product_id', productId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

    if (analyticsError) {
      throw analyticsError
    }

    // Calculate totals
    const totalImpressions = analytics?.reduce((sum, a) => sum + (a.impressions || 0), 0) || 0
    const totalClicks = analytics?.reduce((sum, a) => sum + (a.clicks || 0), 0) || 0
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgRanking = analytics?.length > 0
      ? analytics.reduce((sum, a) => sum + (parseFloat(a.avg_position) || 0), 0) / analytics.length
      : null

    return NextResponse.json({
      product_id: productId,
      period: 'last_30_days',
      total_impressions: totalImpressions,
      total_clicks: totalClicks,
      ctr: parseFloat(ctr.toFixed(2)),
      average_ranking: avgRanking ? parseFloat(avgRanking.toFixed(2)) : null
    })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/search/[productId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
