import { createClient } from '@/lib/supabase/server'

export type ProductBadge = 'new' | 'trending' | 'bestseller' | 'popular' | null

interface ProductData {
  id: string
  created_at: string
  views_count?: number
  sales_count?: number
  wishlist_count?: number
  grade_id: string
  subject_id: string
}

/**
 * Calculate badge for a product
 * Priority: New > Trending > Bestseller > Popular
 */
export async function calculateProductBadge(
  product: ProductData
): Promise<ProductBadge> {
  // Check New badge first (highest priority)
  if (isNewProduct(product)) {
    return 'new'
  }

  // Check Trending badge
  if (await isTrendingProduct(product)) {
    return 'trending'
  }

  // Check Bestseller badge
  if (await isBestsellerProduct(product)) {
    return 'bestseller'
  }

  // Check Popular badge
  if (isPopularProduct(product)) {
    return 'popular'
  }

  return null
}

/**
 * New Badge: Published within last 30 days
 */
function isNewProduct(product: ProductData): boolean {
  const createdAt = new Date(product.created_at)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return createdAt >= thirtyDaysAgo
}

/**
 * Trending Badge: Sales + views in last 7 days > 2x average in category
 * OR Top 20 products by views in last 7 days
 * 
 * Note: For MVP, we'll use a simplified check based on recent activity
 * Full implementation would require product_views table with timestamps
 */
async function isTrendingProduct(product: ProductData): Promise<boolean> {
  // Simplified: If product has high views/sales in last 7 days
  // For MVP, we'll check if views_count + sales_count > threshold
  const recentActivity = (product.views_count || 0) + (product.sales_count || 0)
  
  // Threshold: 50+ combined views and sales (adjustable)
  // In production, this would query product_views table for last 7 days
  return recentActivity >= 50
}

/**
 * Bestseller Badge: Top 10% of sales in its grade+subject category
 * Minimum 10 sales required
 */
async function isBestsellerProduct(product: ProductData): Promise<boolean> {
  if ((product.sales_count || 0) < 10) {
    return false
  }

  try {
    const supabase = await createClient()

    // Get all products in same grade+subject category
    const { data: categoryProducts, error } = await supabase
      .from('products')
      .select('id, sales_count')
      .eq('grade_id', product.grade_id)
      .eq('subject_id', product.subject_id)
      .eq('status', 'published')
      .not('sales_count', 'is', null)
      .order('sales_count', { ascending: false })

    if (error || !categoryProducts || categoryProducts.length === 0) {
      return false
    }

    // Calculate top 10% threshold
    const top10PercentIndex = Math.floor(categoryProducts.length * 0.1)
    const top10PercentThreshold =
      categoryProducts[top10PercentIndex]?.sales_count || 0

    return (product.sales_count || 0) >= top10PercentThreshold
  } catch (error) {
    console.error('Error calculating bestseller badge:', error)
    return false
  }
}

/**
 * Popular Badge: 50+ wishlist adds OR 100+ views in 30 days
 */
function isPopularProduct(product: ProductData): boolean {
  const wishlistCount = product.wishlist_count || 0
  const viewsCount = product.views_count || 0

  return wishlistCount >= 50 || viewsCount >= 100
}

/**
 * Format number for display (e.g., 1234 -> "1.2k")
 */
export function formatCount(count: number): string {
  if (count < 1000) {
    return count.toString()
  } else if (count < 1000000) {
    return `${(count / 1000).toFixed(1)}k`
  } else {
    return `${(count / 1000000).toFixed(1)}M`
  }
}
