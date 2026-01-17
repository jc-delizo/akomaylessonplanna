import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/seller/analytics/search/performance/[productId]
 * Get search performance score for a product (Pro/Pioneer only)
 * 
 * Returns: Performance score (0-100) and percentile
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
      .select('seller_id, grade_id, subject_id')
      .eq('id', productId)
      .single()

    if (productError || !product || product.seller_id !== user.id) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      )
    }

    // Get search analytics for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: analytics } = await supabase
      .from('search_analytics')
      .select('impressions, clicks, avg_position')
      .eq('product_id', productId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

    // Calculate performance score
    // Formula: 30% Avg. Ranking Position + 25% CTR + 20% Search Volume + 15% Keyword Coverage + 10% Trend
    const totalImpressions = analytics?.reduce((sum, a) => sum + (a.impressions || 0), 0) || 0
    const totalClicks = analytics?.reduce((sum, a) => sum + (a.clicks || 0), 0) || 0
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0
    const avgRanking = analytics?.length > 0
      ? analytics.reduce((sum, a) => sum + (parseFloat(a.avg_position) || 0), 0) / analytics.length
      : 100 // Default to worst ranking if no data

    // Normalize scores (0-100)
    const rankingScore = Math.max(0, 100 - (avgRanking * 10)) // Lower ranking = higher score
    const ctrScore = Math.min(100, ctr * 10) // CTR * 10, capped at 100
    const volumeScore = Math.min(100, totalImpressions / 10) // Impressions / 10, capped at 100
    const keywordCoverage = Math.min(100, (analytics?.length || 0) * 10) // Number of keywords * 10
    const trendScore = 50 // Placeholder - would need previous period data

    const performanceScore = (
      rankingScore * 0.3 +
      ctrScore * 0.25 +
      volumeScore * 0.2 +
      keywordCoverage * 0.15 +
      trendScore * 0.1
    )

    // Get percentile (simplified - would need competitor data for accurate percentile)
    const percentile = Math.min(100, Math.max(0, performanceScore))

    return NextResponse.json({
      product_id: productId,
      performance_score: parseFloat(performanceScore.toFixed(1)),
      percentile: parseFloat(percentile.toFixed(0)),
      breakdown: {
        ranking_score: parseFloat(rankingScore.toFixed(1)),
        ctr_score: parseFloat(ctrScore.toFixed(1)),
        volume_score: parseFloat(volumeScore.toFixed(1)),
        keyword_coverage: parseFloat(keywordCoverage.toFixed(1)),
        trend_score: parseFloat(trendScore.toFixed(1))
      }
    })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/search/performance/[productId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
