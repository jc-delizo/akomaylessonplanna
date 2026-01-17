import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json({ error: 'product_id required' }, { status: 400 })
    }

    // Get seller's product
    const { data: product } = await supabase
      .from('products')
      .select('id, grade_id, subject_id, product_type, views_count, sales_count, conversion_rate, avg_rating')
      .eq('id', productId)
      .eq('seller_id', user.id)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Get average metrics for similar products (same grade, subject, type)
    const { data: similarProducts } = await supabase
      .from('products')
      .select('views_count, sales_count, conversion_rate, avg_rating')
      .eq('grade_id', product.grade_id)
      .eq('subject_id', product.subject_id)
      .eq('product_type', product.product_type)
      .eq('status', 'published')
      .neq('id', productId)

    const avgViews =
      similarProducts && similarProducts.length > 0
        ? similarProducts.reduce((sum, p) => sum + (p.views_count || 0), 0) / similarProducts.length
        : 0
    const avgSales =
      similarProducts && similarProducts.length > 0
        ? similarProducts.reduce((sum, p) => sum + (p.sales_count || 0), 0) / similarProducts.length
        : 0
    const avgConversion =
      similarProducts && similarProducts.length > 0
        ? similarProducts
            .filter((p) => p.conversion_rate)
            .reduce((sum, p) => sum + (p.conversion_rate || 0), 0) /
          similarProducts.filter((p) => p.conversion_rate).length
        : 0
    const avgRating =
      similarProducts && similarProducts.length > 0
        ? similarProducts
            .filter((p) => p.avg_rating)
            .reduce((sum, p) => sum + (p.avg_rating || 0), 0) /
          similarProducts.filter((p) => p.avg_rating).length
        : 0

    // Calculate percentile (simplified)
    const betterProducts =
      similarProducts?.filter(
        (p) =>
          (p.sales_count || 0) < (product.sales_count || 0) &&
          (p.conversion_rate || 0) < (product.conversion_rate || 0)
      ).length || 0
    const percentile =
      similarProducts && similarProducts.length > 0
        ? (betterProducts / similarProducts.length) * 100
        : 50

    return NextResponse.json({
      product: {
        views: product.views_count || 0,
        sales: product.sales_count || 0,
        conversion: product.conversion_rate || 0,
        rating: product.avg_rating || 0,
      },
      average: {
        views: avgViews,
        sales: avgSales,
        conversion: avgConversion,
        rating: avgRating,
      },
      percentile: Math.round(percentile),
      comparison: {
        views: product.views_count || 0 > avgViews ? 'above' : 'below',
        sales: product.sales_count || 0 > avgSales ? 'above' : 'below',
        conversion: (product.conversion_rate || 0) > avgConversion ? 'above' : 'below',
        rating: (product.avg_rating || 0) > avgRating ? 'above' : 'below',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/seller/analytics/comparison:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
