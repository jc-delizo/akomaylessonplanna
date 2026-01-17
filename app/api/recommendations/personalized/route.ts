import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/recommendations/personalized
 * Get personalized recommendations for logged-in user
 * 
 * Free users: Last 3 viewed + wishlist + same grade
 * Pro/Pioneer: Purchase history + download history + browsing history + profile data
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      // Anonymous user - return trending products
      const { data: trending } = await supabase
        .from('products')
        .select(`
          *,
          seller:users!products_seller_id_fkey(
            id,
            name,
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
          )
        `)
        .eq('status', 'published')
        .order('sales_count', { ascending: false })
        .order('views_count', { ascending: false })
        .limit(8)

      return NextResponse.json({
        products: trending || []
      })
    }

    // Get user profile to check subscription tier
    const { data: userProfile } = await supabase
      .from('users')
      .select('subscription_tier, grade_levels_taught, subjects_taught')
      .eq('id', user.id)
      .single()

    const isProOrPioneer = userProfile?.subscription_tier === 'pro' || userProfile?.subscription_tier === 'pioneer'

    let recommendedProducts: any[] = []

    if (isProOrPioneer) {
      // Pro/Pioneer: Advanced recommendations
      // Based on: Purchase history, download history, browsing history, profile data
      
      // Get recently viewed products
      const { data: recentlyViewed } = await supabase
        .from('recently_viewed')
        .select('product_id')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(5)

      const viewedProductIds = (recentlyViewed || []).map((rv: any) => rv.product_id)

      // Get products from same grade/subject as user teaches
      const gradeIds = userProfile?.grade_levels_taught || []
      const subjectIds = userProfile?.subjects_taught || []

      if (gradeIds.length > 0 || subjectIds.length > 0) {
        let query = supabase
          .from('products')
          .select(`
            *,
            seller:users!products_seller_id_fkey(
              id,
              name,
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
            )
          `)
          .eq('status', 'published')
          .not('id', 'in', `(${viewedProductIds.join(',') || 'null'})`)

        if (gradeIds.length > 0) {
          query = query.in('grade_id', gradeIds)
        }
        if (subjectIds.length > 0) {
          query = query.in('subject_id', subjectIds)
        }

        const { data: profileBased } = await query
          .order('sales_count', { ascending: false })
          .limit(8)

        recommendedProducts = profileBased || []
      }
    } else {
      // Free users: Simple recommendations
      // Based on: Last 3 viewed + wishlist + same grade
      
      // Get recently viewed products
      const { data: recentlyViewed } = await supabase
        .from('recently_viewed')
        .select('product_id')
        .eq('user_id', user.id)
        .order('viewed_at', { ascending: false })
        .limit(3)

      const viewedProductIds = (recentlyViewed || []).map((rv: any) => rv.product_id)

      // Get products from same grade as viewed products
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
            .select(`
              *,
              seller:users!products_seller_id_fkey(
                id,
                name,
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
              )
            `)
            .eq('status', 'published')
            .eq('grade_id', gradeId)
            .not('id', 'in', `(${viewedProductIds.join(',') || 'null'})`)
            .order('sales_count', { ascending: false })
            .limit(8)

          recommendedProducts = sameGradeProducts || []
        }
      }
    }

    // Fallback to trending if no recommendations
    if (recommendedProducts.length === 0) {
      const { data: trending } = await supabase
        .from('products')
        .select(`
          *,
          seller:users!products_seller_id_fkey(
            id,
            name,
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
          )
        `)
        .eq('status', 'published')
        .order('sales_count', { ascending: false })
        .limit(8)

      recommendedProducts = trending || []
    }

    return NextResponse.json({
      products: recommendedProducts.slice(0, 8)
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/recommendations/personalized:', error)
    return NextResponse.json(
      { error: 'Internal server error', products: [] },
      { status: 500 }
    )
  }
}
