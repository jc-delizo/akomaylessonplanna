'use client'

export type ProductBadge = 'new' | 'trending' | 'bestseller' | 'popular' | null

interface ProductData {
  id: string
  created_at?: string
  views_count?: number
  sales_count?: number
  wishlist_count?: number
}

/**
 * Calculate badge for a product (client-side simplified version)
 * Priority: New > Trending > Bestseller > Popular
 * 
 * Note: This is a simplified version. Full calculation with category comparisons
 * would require server-side logic. For MVP, we use simple thresholds.
 */
export function calculateProductBadgeClient(
  product: ProductData
): ProductBadge {
  // Check New badge first (highest priority)
  if (isNewProduct(product)) {
    return 'new'
  }

  // Check Bestseller badge (simplified: 50+ sales)
  if ((product.sales_count || 0) >= 50) {
    return 'bestseller'
  }

  // Check Trending badge (simplified: 30+ combined views and sales)
  const recentActivity = (product.views_count || 0) + (product.sales_count || 0)
  if (recentActivity >= 30) {
    return 'trending'
  }

  // Check Popular badge (simplified: 20+ wishlist or 50+ views)
  const wishlistCount = product.wishlist_count || 0
  const viewsCount = product.views_count || 0
  if (wishlistCount >= 20 || viewsCount >= 50) {
    return 'popular'
  }

  return null
}

/**
 * New Badge: Published within last 30 days
 */
function isNewProduct(product: ProductData): boolean {
  if (!product.created_at) return false
  const createdAt = new Date(product.created_at)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  return createdAt >= thirtyDaysAgo
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
