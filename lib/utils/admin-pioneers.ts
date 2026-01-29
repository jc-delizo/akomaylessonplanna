import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get pioneers list with metrics. Safe to call from server components or API routes.
 */
export async function getPioneersData(supabase: SupabaseClient) {
  const { data: pioneers, error } = await supabase
    .from('users')
    .select(
      'id, first_name, last_name, username, email, avatar_url, subscription_tier, is_pioneer, custom_commission_rate, created_at'
    )
    .eq('is_pioneer', true)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching pioneers:', error)
    throw new Error('Failed to fetch pioneers')
  }

  const pioneersWithMetrics = await Promise.all(
    (pioneers || []).map(async (pioneer: any) => {
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', pioneer.id)
        .eq('status', 'published')

      const { count: salesCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', pioneer.id)

      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data: recentSales } = await supabase
        .from('order_items')
        .select('price, commission')
        .eq('seller_id', pioneer.id)
        .gte('created_at', thirtyDaysAgo.toISOString())

      const revenue = recentSales?.reduce((sum, s) => sum + Number(s.price || 0), 0) || 0
      const commissionSaved =
        recentSales?.reduce((sum, s) => sum + Number(s.price || 0) * 0.05, 0) || 0

      const { data: productIds } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', pioneer.id)
      const ids = (productIds || []).map((p: any) => p.id)
      let avgRating = 0
      if (ids.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .in('product_id', ids)
        avgRating =
          reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0
      }

      return {
        ...pioneer,
        metrics: {
          productCount: productCount || 0,
          salesCount: salesCount || 0,
          revenue,
          commissionSaved,
          avgRating: Math.round(avgRating * 10) / 10,
        },
      }
    })
  )

  return {
    pioneers: pioneersWithMetrics,
    total: pioneersWithMetrics.length,
    maxSlots: 20,
    availableSlots: 20 - pioneersWithMetrics.length,
  }
}

/**
 * Get pioneer candidates with quality score. Safe to call from server components or API routes.
 */
export async function getPioneersCandidatesData(supabase: SupabaseClient) {
  const { data: sellers, error: sellersError } = await supabase
    .from('users')
    .select('id, first_name, last_name, username, email, avatar_url, created_at, is_verified_teacher')
    .eq('role', 'seller')
    .eq('is_verified_teacher', true)
    .eq('is_pioneer', false)
    .order('created_at', { ascending: false })

  if (sellersError) {
    console.error('Error fetching candidates:', sellersError)
    throw new Error('Failed to fetch candidates')
  }

  const ninetyDaysAgo = new Date()
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

  const candidatesWithScore = await Promise.all(
    (sellers || []).map(async (seller: any) => {
      const { count: salesCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', seller.id)
        .gte('created_at', ninetyDaysAgo.toISOString())

      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', seller.id)
        .eq('status', 'published')

      const { data: productIds } = await supabase
        .from('products')
        .select('id')
        .eq('seller_id', seller.id)
      const ids = (productIds || []).map((p: any) => p.id)
      let avgRating = 0
      if (ids.length > 0) {
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .in('product_id', ids)
        avgRating =
          reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0
      }

      const { count: followersCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', seller.id)

      const salesScore = Math.min((salesCount || 0) / 10, 1) * 30
      const ratingScore = (avgRating / 5) * 25
      const productsScore = Math.min((productCount || 0) / 20, 1) * 20
      const engagementScore = Math.min((followersCount || 0) / 100, 1) * 15
      const professionalismScore = seller.is_verified_teacher ? 10 : 0
      const qualityScore = Math.round(
        salesScore + ratingScore + productsScore + engagementScore + professionalismScore
      )

      return {
        ...seller,
        qualityScore,
        metrics: {
          salesCount: salesCount || 0,
          productCount: productCount || 0,
          avgRating: Math.round(avgRating * 10) / 10,
          followersCount: followersCount || 0,
        },
      }
    })
  )

  candidatesWithScore.sort((a: any, b: any) => b.qualityScore - a.qualityScore)

  return {
    candidates: candidatesWithScore,
    total: candidatesWithScore.length,
  }
}
