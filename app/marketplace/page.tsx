import { createClient } from '@/lib/supabase/server'
import { ProductTabs } from '@/components/products/product-tabs'
import { CurvedLoopHero } from '@/components/curved-loop-hero'
import { MarketplaceEmptyState } from '@/components/marketplace/marketplace-empty-state'
import { getMarketplaceClosed } from '@/lib/utils/marketplace-status'

// Attach subject_ids to all product groups in one query (for "Multiple Subjects" on cards).
async function attachSubjectIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productGroups: any[][]
): Promise<any[][]> {
  const productIds = [...new Set(productGroups.flatMap((products) => products.map((product) => product.id)))]
  if (productIds.length === 0) return productGroups

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
  return productGroups.map((products) =>
    products.map((product) => ({
      ...product,
      subject_ids: productSubjectIds[product.id]?.length
        ? productSubjectIds[product.id]
        : product.subject_id
          ? [product.subject_id]
          : [],
    }))
  )
}

// Helper function to transform products to add 'name' field for backward compatibility
function transformProducts(products: any[]): any[] {
  if (!products) return []
  return products.map((p: any) => {
    if (p.seller) {
      const firstName = p.seller.first_name || ''
      const lastName = p.seller.last_name || ''
      return {
        ...p,
        seller: {
          ...p.seller,
          name: `${firstName} ${lastName}`.trim() || firstName,
        },
      }
    }
    return p
  })
}

export default async function MarketplacePage() {
  const supabase = await createClient()

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
      )
    `
  const [
    marketplaceClosed,
    authResult,
    featuredResult,
    newResult,
    trendingResult,
    bestsellerResult,
  ] = await Promise.all([
    getMarketplaceClosed(supabase),
    supabase.auth.getUser(),
    supabase
      .from('products')
      .select(productSelect)
      .eq('status', 'published')
      .contains('badges', ['featured'])
      .order('created_at', { ascending: false })
      .limit(14),
    supabase
      .from('products')
      .select(productSelect)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(21),
    supabase
      .from('products')
      .select(productSelect)
      .eq('status', 'published')
      .order('sales_count', { ascending: false })
      .limit(14),
    supabase
      .from('products')
      .select(productSelect)
      .eq('status', 'published')
      .not('avg_rating', 'is', null)
      .gte('sales_count', 5)
      .order('avg_rating', { ascending: false })
      .limit(14),
  ])

  const user = authResult.data.user
  const featuredProducts = featuredResult.data || []
  const newProducts = newResult.data || []
  const trendingProducts = trendingResult.data || []
  const bestsellerProducts = bestsellerResult.data || []

  // Fetch recommended products and teaching-completion for empty state
  let recommendedProducts: any[] = []
  let teachingComplete = true // default when not logged in
  if (user) {
    // Get user profile: subscription tier + teaching fields (for recommendations and completion check)
    const { data: userProfile } = await supabase
      .from('users')
      .select(
        'subscription_tier, grade_levels_taught, subjects_taught, teaching_strand_ids'
      )
      .eq('id', user.id)
      .single()

    // Keep this in sync with the Teaching tab completion rule on profile edit.
    const teachingStrandIds = (userProfile?.teaching_strand_ids as string[] | null) ?? []
    const gradeLevelsTaught = (userProfile?.grade_levels_taught as string[] | null) ?? []
    const subjectsTaught = (userProfile?.subjects_taught as string[] | null) ?? []
    teachingComplete =
      teachingStrandIds.length > 0 ||
      (subjectsTaught.length > 0 && gradeLevelsTaught.length > 0)

    const isProOrPioneer = userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'pioneer'

    // Only fetch recommendations when Teaching tab is complete; otherwise leave empty for profile prompt
    if (teachingComplete) {
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

    // Only fall back to trending when user is logged in AND teaching is complete (so we can show profile prompt when not)
    if (recommendedProducts.length === 0 && teachingComplete) {
      recommendedProducts = trendingProducts
    }
  } else {
    recommendedProducts = trendingProducts
  }

  const [
    withSubjectIdsFeatured,
    withSubjectIdsNew,
    withSubjectIdsTrending,
    withSubjectIdsBestseller,
    withSubjectIdsRecommended,
  ] = await attachSubjectIds(supabase, [
    featuredProducts,
    newProducts,
    trendingProducts,
    bestsellerProducts,
    recommendedProducts,
  ])

  const transformedFeaturedProducts = transformProducts(withSubjectIdsFeatured)
  const transformedNewProducts = transformProducts(withSubjectIdsNew)
  const transformedTrendingProducts = transformProducts(withSubjectIdsTrending)
  const transformedBestsellerProducts = transformProducts(withSubjectIdsBestseller)
  const transformedRecommendedProducts = transformProducts(withSubjectIdsRecommended)
  const hasProducts = [
    transformedFeaturedProducts,
    transformedNewProducts,
    transformedTrendingProducts,
    transformedBestsellerProducts,
    transformedRecommendedProducts,
  ].some((products) => products.length > 0)

  const content = (
    <>
      <CurvedLoopHero hasProducts={hasProducts} />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {hasProducts ? (
          <ProductTabs
            featuredProducts={transformedFeaturedProducts}
            newProducts={transformedNewProducts}
            trendingProducts={transformedTrendingProducts}
            bestsellerProducts={transformedBestsellerProducts}
            recommendedProducts={transformedRecommendedProducts}
            teachingComplete={teachingComplete}
          />
        ) : (
          <MarketplaceEmptyState isSignedIn={Boolean(user)} />
        )}
      </div>
    </>
  )

  if (marketplaceClosed) {
    return (
      <div className="relative">
        {content}
        <div
          className="absolute inset-0 z-10 flex items-start justify-center pt-8 backdrop-blur-md bg-white/60"
          aria-hidden="true"
        >
          <p className="text-xl md:text-2xl font-medium text-center text-foreground px-4 max-w-lg">
            Still perfecting this website for you guys! Will open soon!
          </p>
        </div>
      </div>
    )
  }

  return content
}
