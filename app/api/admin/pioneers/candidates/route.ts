import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/pioneers/candidates
 * Get Pioneer candidates with Quality Score
 * 
 * Quality Score calculation:
 * - Sales: 30%
 * - Rating: 25%
 * - Products: 20%
 * - Engagement: 15%
 * - Professionalism: 10%
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()

    // Get all verified sellers who are not already Pioneers
    const { data: sellers, error: sellersError } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, email, avatar_url, created_at, is_verified_teacher')
      .eq('role', 'seller')
      .eq('is_verified_teacher', true)
      .eq('is_pioneer', false)
      .order('created_at', { ascending: false })

    if (sellersError) {
      console.error('Error fetching candidates:', sellersError)
      return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 })
    }

    // Calculate Quality Score for each candidate
    const candidatesWithScore = await Promise.all(
      (sellers || []).map(async (seller) => {
        // Get sales count (last 90 days)
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)
        const { count: salesCount } = await supabase
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', seller.id)
          .gte('created_at', ninetyDaysAgo.toISOString())

        // Get product count
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', seller.id)
          .eq('status', 'published')

        // Get average rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .in('product_id', (
            await supabase
              .from('products')
              .select('id')
              .eq('seller_id', seller.id)
          ).data?.map((p: any) => p.id) || [])

        const avgRating =
          reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0

        // Get engagement (followers, response time)
        const { count: followersCount } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', seller.id)

        // Calculate Quality Score (0-100)
        const salesScore = Math.min((salesCount || 0) / 10, 1) * 30 // Max 30 points
        const ratingScore = (avgRating / 5) * 25 // Max 25 points
        const productsScore = Math.min((productCount || 0) / 20, 1) * 20 // Max 20 points
        const engagementScore = Math.min((followersCount || 0) / 100, 1) * 15 // Max 15 points
        const professionalismScore = seller.is_verified_teacher ? 10 : 0 // 10 points if verified

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

    // Sort by Quality Score (highest first)
    candidatesWithScore.sort((a, b) => b.qualityScore - a.qualityScore)

    return NextResponse.json({
      candidates: candidatesWithScore,
      total: candidatesWithScore.length,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/pioneers/candidates:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
