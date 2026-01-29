import { createClient } from '@/lib/supabase/server'
import { ProductCard } from '@/components/products/product-card'
import { ProductTabs } from '@/components/products/product-tabs'
import { CurvedLoopHero } from '@/components/curved-loop-hero'
import Link from 'next/link'

// Helper: attach subject_ids from product_subjects for each product (for "Multiple Subjects" on cards)
async function attachSubjectIds(supabase: Awaited<ReturnType<typeof createClient>>, products: any[]): Promise<any[]> {
  if (!products || products.length === 0) return products || []
  const productIds = products.map((p: any) => p.id)
  const productSubjectIds: Record<string, string[]> = {}
  const { data: psRows } = await supabase
    .from('product_subjects')
    .select('product_id, subject_id, sort_order')
    .in('product_id', productIds)
    .order('sort_order', { ascending: true })
  for (const row of psRows || []) {
    if (!productSubjectIds[row.product_id]) productSubjectIds[row.product_id] = []
    productSubjectIds[row.product_id].push(row.subject_id)
  }
  return products.map((p: any) => ({
    ...p,
    subject_ids: productSubjectIds[p.id]?.length ? productSubjectIds[p.id] : (p.subject_id ? [p.subject_id] : []),
  }))
}

// Helper function to transform products to add 'name' field for backward compatibility
function transformProducts(products: any[]): any[] {
  if (!products) return []
  return products.map((p: any) => {
    if (p.seller) {
      const firstName = p.seller.first_name || ''
      const lastName = p.seller.last_name || ''
      p.seller.name = `${firstName} ${lastName}`.trim() || firstName
    }
    return p
  })
}

export default async function MarketplacePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch featured products
  const productSelect = `
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
    `
  const { data: featuredProducts } = await supabase
    .from('products')
    .select(productSelect)
    .eq('status', 'published')
    .contains('badges', ['featured'])
    .order('created_at', { ascending: false })
    .limit(14)

  // Fetch new products
  const { data: newProducts } = await supabase
    .from('products')
    .select(productSelect)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(21)

  // Fetch trending products (by sales)
  const { data: trendingProducts } = await supabase
    .from('products')
    .select(productSelect)
    .eq('status', 'published')
    .order('sales_count', { ascending: false })
    .limit(14)

  // Fetch bestsellers (top rated with sales)
  const { data: bestsellerProducts } = await supabase
    .from('products')
    .select(productSelect)
    .eq('status', 'published')
    .not('avg_rating', 'is', null)
    .gte('sales_count', 5)
    .order('avg_rating', { ascending: false })
    .limit(14)

  // Fetch recommended products
  let recommendedProducts: any[] = []
  if (user) {
    // Get user profile to check subscription tier
    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription_tier, grade_levels_taught, subjects_taught')
      .eq('id', user.id)
      .single()

    const isProOrPioneer = userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'pioneer'

    if (isProOrPioneer) {
      // Pro/Pioneer: Advanced recommendations
      const { data: recentlyViewed } = await supabase
        .from('recently_viewed')
        .select('product_id')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(5)

      const viewedProductIds = (recentlyViewed || []).map((rv: any) => rv.product_id)
      const gradeIds = userProfile?.grade_levels_taught || []
      const subjectIds = userProfile?.subjects_taught || []

      if (gradeIds.length > 0 || subjectIds.length > 0) {
        let query = supabase
          .from('products')
          .select(productSelect)
          .eq('status', 'published')

        if (gradeIds.length > 0) {
          query = query.in('grade_id', gradeIds)
        }
        if (subjectIds.length > 0) {
          query = query.in('subject_id', subjectIds)
        }

        const { data: profileBased } = await query
          .order('sales_count', { ascending: false })
          .limit(20)

        // Filter out already viewed products
        recommendedProducts = (profileBased || []).filter(
          (p: any) => !viewedProductIds.includes(p.id)
        ).slice(0, 14)
      }
    } else {
      // Free users: Simple recommendations based on recently viewed
      const { data: recentlyViewed } = await supabase
        .from('recently_viewed')
        .select('product_id')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(3)

      const viewedProductIds = (recentlyViewed || []).map((rv: any) => rv.product_id)

      if (viewedProductIds.length > 0) {
        const { data: viewedProducts } = await supabase
          .from('products')
          .select('grade_id')
          .in('id', viewedProductIds)
          .limit(1)

        if (viewedProducts && viewedProducts.length > 0) {
          const gradeId = viewedProducts[0].grade_id

          const { data: sameGradeProducts } = await supabase
            .from('products')
            .select(productSelect)
            .eq('status', 'published')
            .eq('grade_id', gradeId)
            .order('sales_count', { ascending: false })
            .limit(14)

          recommendedProducts = sameGradeProducts || []
        }
      }
    }
  }

  // Fallback to trending if no recommendations
  if (recommendedProducts.length === 0) {
    const { data: trending } = await supabase
      .from('products')
      .select(productSelect)
      .eq('status', 'published')
      .order('sales_count', { ascending: false })
      .limit(14)

    recommendedProducts = trending || []
  }

  // Attach subject_ids for "Multiple Subjects" on cards, then transform (seller name)
  const withSubjectIdsFeatured = await attachSubjectIds(supabase, featuredProducts || [])
  const withSubjectIdsNew = await attachSubjectIds(supabase, newProducts || [])
  const withSubjectIdsTrending = await attachSubjectIds(supabase, trendingProducts || [])
  const withSubjectIdsBestseller = await attachSubjectIds(supabase, bestsellerProducts || [])
  const withSubjectIdsRecommended = await attachSubjectIds(supabase, recommendedProducts || [])

  const transformedFeaturedProducts = transformProducts(withSubjectIdsFeatured)
  const transformedNewProducts = transformProducts(withSubjectIdsNew)
  const transformedTrendingProducts = transformProducts(withSubjectIdsTrending)
  const transformedBestsellerProducts = transformProducts(withSubjectIdsBestseller)
  const transformedRecommendedProducts = transformProducts(withSubjectIdsRecommended)

  return (
    <>
      {/* CurvedLoop Hero Section */}
      <CurvedLoopHero />

      <div className="container mx-auto px-4 py-8">
        {/* Product Tabs - Featured, New Arrivals, Trending, Best Sellers, Recommended */}
        <ProductTabs
          featuredProducts={transformedFeaturedProducts}
          newProducts={transformedNewProducts}
          trendingProducts={transformedTrendingProducts}
          bestsellerProducts={transformedBestsellerProducts}
          recommendedProducts={transformedRecommendedProducts}
        />

        {/* Empty state */}
        {(!transformedNewProducts || transformedNewProducts.length === 0) && (
          <div className="text-center py-12">
            <svg
              className="mx-auto w-24 h-24 text-gray-400 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <h3 className="text-xl font-semibold mb-2">No products yet</h3>
            <p className="text-gray-600 mb-4">
              Be the first to upload educational resources!
            </p>
            {user && (
              <Link href="/shop/products/new">
                <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700">
                  Upload Product
                </button>
              </Link>
            )}
          </div>
        )}
      </div>
    </>
  )
}
