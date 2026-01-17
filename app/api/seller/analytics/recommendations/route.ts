import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is Pro/Pioneer seller
    const { data: userData } = await supabase
      .from('users')
      .select('role, can_sell, subscription_tier')
      .eq('id', user.id)
      .single()

    if (!userData || userData.role !== 'seller' || !userData.can_sell) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const isProOrPioneer =
      userData.subscription_tier === 'pro' || userData.subscription_tier === 'pioneer'

    if (!isProOrPioneer) {
      return NextResponse.json({ error: 'Pro/Pioneer subscription required' }, { status: 403 })
    }

    // Get products with analytics
    const { data: products } = await supabase
      .from('products')
      .select('id, title, price, views_count, sales_count, conversion_rate, cover_image_url, product_type')
      .eq('seller_id', user.id)
      .eq('status', 'published')

    const recommendations: Array<{
      type: 'price' | 'trending' | 'preview' | 'response_time' | 'category'
      priority: 'high' | 'medium' | 'low'
      title: string
      message: string
      actionUrl?: string
    }> = []

    // Analyze products for recommendations
    products?.forEach((product) => {
      // High views, low conversion - suggest price reduction
      if (product.views_count > 100 && product.conversion_rate < 2) {
        recommendations.push({
          type: 'price',
          priority: 'high',
          title: 'High views, low conversion',
          message: `Consider lowering price of "${product.title}" from ₱${product.price.toFixed(2)} to ₱${(product.price * 0.8).toFixed(2)}`,
          actionUrl: `/shop/products/${product.id}/edit`,
        })
      }

      // Trending product - suggest creating similar
      if (product.views_count > 500 && product.conversion_rate > 5) {
        recommendations.push({
          type: 'trending',
          priority: 'medium',
          title: 'Trending product',
          message: `"${product.title}" is performing well. Consider creating similar products for this category.`,
          actionUrl: `/shop/products/${product.id}`,
        })
      }

      // Missing preview images
      if (!product.cover_image_url && product.views_count > 50) {
        recommendations.push({
          type: 'preview',
          priority: 'medium',
          title: 'Add preview images',
          message: `Products with previews sell 3x more. Add preview images to "${product.title}"`,
          actionUrl: `/shop/products/${product.id}/edit`,
        })
      }
    })

    // Category performance
    const categoryPerformance: Record<string, { views: number; sales: number }> = {}
    products?.forEach((product) => {
      const category = product.product_type
      if (!categoryPerformance[category]) {
        categoryPerformance[category] = { views: 0, sales: 0 }
      }
      categoryPerformance[category].views += product.views_count || 0
      categoryPerformance[category].sales += product.sales_count || 0
    })

    const topCategory = Object.entries(categoryPerformance).sort(
      (a, b) => b[1].sales - a[1].sales
    )[0]

    if (topCategory) {
      recommendations.push({
        type: 'category',
        priority: 'low',
        title: 'Top performing category',
        message: `Your ${topCategory[0].replace('_', ' ')} products are performing well. Consider creating more products in this category.`,
      })
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 }
    recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])

    return NextResponse.json({ recommendations: recommendations.slice(0, 10) })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/recommendations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
