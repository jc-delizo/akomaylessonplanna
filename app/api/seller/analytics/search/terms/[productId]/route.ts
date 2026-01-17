import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/seller/analytics/search/terms/[productId]
 * Get search terms report for a product (top 10)
 * 
 * Returns: Search terms with impressions, clicks, CTR, trend
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

    // Get search terms for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: currentPeriod, error: currentError } = await supabase
      .from('search_analytics')
      .select('search_term, impressions, clicks')
      .eq('product_id', productId)
      .gte('date', thirtyDaysAgo.toISOString().split('T')[0])

    if (currentError) {
      throw currentError
    }

    // Get previous period for trend calculation
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const { data: previousPeriod, error: prevError } = await supabase
      .from('search_analytics')
      .select('search_term, impressions, clicks')
      .eq('product_id', productId)
      .gte('date', sixtyDaysAgo.toISOString().split('T')[0])
      .lt('date', thirtyDaysAgo.toISOString().split('T')[0])

    // Aggregate by search term
    const termMap = new Map<string, { impressions: number; clicks: number }>()

    // Current period
    currentPeriod?.forEach((item: any) => {
      const existing = termMap.get(item.search_term) || { impressions: 0, clicks: 0 }
      termMap.set(item.search_term, {
        impressions: existing.impressions + (item.impressions || 0),
        clicks: existing.clicks + (item.clicks || 0)
      })
    })

    // Previous period (for trend)
    const prevTermMap = new Map<string, { impressions: number; clicks: number }>()
    previousPeriod?.forEach((item: any) => {
      const existing = prevTermMap.get(item.search_term) || { impressions: 0, clicks: 0 }
      prevTermMap.set(item.search_term, {
        impressions: existing.impressions + (item.impressions || 0),
        clicks: existing.clicks + (item.clicks || 0)
      })
    })

    // Convert to array and calculate metrics
    const terms = Array.from(termMap.entries())
      .map(([search_term, data]) => {
        const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0
        const prevData = prevTermMap.get(search_term) || { impressions: 0, clicks: 0 }
        const trend = prevData.impressions > 0
          ? ((data.impressions - prevData.impressions) / prevData.impressions) * 100
          : 0

        return {
          search_term,
          impressions: data.impressions,
          clicks: data.clicks,
          ctr: parseFloat(ctr.toFixed(2)),
          trend: parseFloat(trend.toFixed(1))
        }
      })
      .sort((a, b) => b.impressions - a.impressions)
      .slice(0, 10)

    return NextResponse.json({
      terms,
      period: 'last_30_days'
    })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/search/terms/[productId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
