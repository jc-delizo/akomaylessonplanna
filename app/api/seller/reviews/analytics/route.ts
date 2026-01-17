import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/seller/reviews/analytics
 * Get review analytics for seller (Pro/Pioneer only)
 * 
 * Returns:
 * - Rating distribution (count and percentage for each rating)
 * - Most common keywords from reviews
 * - Review trends over time (monthly averages)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify user is a seller with Pro or Pioneer subscription
    const { data: userData } = await supabase
      .from('users')
      .select('role, can_sell, subscription_tier, is_pioneer')
      .eq('id', user.id)
      .single()

    if (!userData || (userData.role !== 'seller' && !userData.can_sell)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check subscription tier (Pro or Pioneer only)
    if (userData.subscription_tier !== 'pro' && userData.subscription_tier !== 'pioneer' && !userData.is_pioneer) {
      return NextResponse.json(
        { error: 'Enhanced analytics are only available for Pro and Pioneer sellers' },
        { status: 403 }
      )
    }

    // Get seller's product IDs first
    const { data: sellerProducts } = await supabase
      .from('products')
      .select('id')
      .eq('seller_id', user.id)

    if (!sellerProducts || sellerProducts.length === 0) {
      return NextResponse.json({
        distribution: {
          5: { count: 0, percentage: 0 },
          4: { count: 0, percentage: 0 },
          3: { count: 0, percentage: 0 },
          2: { count: 0, percentage: 0 },
          1: { count: 0, percentage: 0 },
        },
        keywords: [],
        trends: [],
        totalReviews: 0,
      })
    }

    const productIds = sellerProducts.map(p => p.id)

    // Get all reviews for seller's products
    const { data: reviews, error: reviewsError } = await supabase
      .from('reviews')
      .select(`
        rating,
        comment,
        created_at
      `)
      .in('product_id', productIds)
      .eq('is_flagged', false)

    if (reviewsError) {
      console.error('Error fetching reviews for analytics:', reviewsError)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    // Calculate rating distribution
    const distribution = {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    }

    reviews?.forEach((review) => {
      const rating = review.rating as keyof typeof distribution
      if (distribution[rating]) {
        distribution[rating].count++
      }
    })

    const totalReviews = reviews?.length || 0
    Object.keys(distribution).forEach((rating) => {
      const key = parseInt(rating) as keyof typeof distribution
      distribution[key].percentage = totalReviews > 0
        ? Math.round((distribution[key].count / totalReviews) * 100 * 100) / 100
        : 0
    })

    // Extract keywords from comments
    const keywords: Record<string, number> = {}
    const commonWords = [
      'clear', 'helpful', 'organized', 'saves time', 'easy to use',
      'complete', 'well-made', 'professional', 'useful', 'excellent',
      'detailed', 'comprehensive', 'quality', 'recommend', 'great'
    ]

    reviews?.forEach((review) => {
      if (review.comment) {
        const comment = review.comment.toLowerCase()
        commonWords.forEach((word) => {
          const regex = new RegExp(`\\b${word}\\b`, 'gi')
          const matches = comment.match(regex)
          if (matches) {
            keywords[word] = (keywords[word] || 0) + matches.length
          }
        })
      }
    })

    // Sort keywords by frequency
    const sortedKeywords = Object.entries(keywords)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count }))

    // Calculate monthly trends
    const monthlyTrends: Record<string, { month: string; average: number; count: number }> = {}
    
    reviews?.forEach((review) => {
      const date = new Date(review.created_at)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!monthlyTrends[monthKey]) {
        monthlyTrends[monthKey] = {
          month: monthKey,
          average: 0,
          count: 0,
        }
      }
      
      monthlyTrends[monthKey].count++
      monthlyTrends[monthKey].average += review.rating
    })

    // Calculate averages
    Object.keys(monthlyTrends).forEach((key) => {
      const trend = monthlyTrends[key]
      trend.average = Math.round((trend.average / trend.count) * 100) / 100
    })

    // Sort by month
    const trends = Object.values(monthlyTrends)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12) // Last 12 months

    return NextResponse.json({
      distribution,
      keywords: sortedKeywords,
      trends,
      totalReviews,
    })
  } catch (error) {
    console.error('Error in GET /api/seller/reviews/analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
