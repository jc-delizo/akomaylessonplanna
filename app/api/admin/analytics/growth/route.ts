import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/analytics/growth
 * Get platform growth analytics (real-time)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()
    const searchParams = request.nextUrl.searchParams
    const timeRange = searchParams.get('timeRange') || 'last_30_days'

    // Calculate date range
    const now = new Date()
    let startDate: Date

    switch (timeRange) {
      case 'last_7_days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'last_30_days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        break
      case 'last_90_days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 90)
        break
      case 'this_year':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(0) // All time
    }

    // Total Users
    const { count: totalUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    // New Signups
    const { count: newSignups } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    // Seller Conversion Rate
    const { count: totalSellers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'seller')
    const sellerConversionRate = totalUsers && totalUsers > 0
      ? ((totalSellers || 0) / totalUsers) * 100
      : 0

    // Active Users (DAU/MAU)
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const { count: activeUsers30d } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .gte('updated_at', thirtyDaysAgo.toISOString())

    // User Growth Over Time
    const { data: usersByDate } = await supabase
      .from('users')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Signup Sources (would need tracking - placeholder)
    const signupSources = {
      organic: 60,
      referral: 20,
      social: 10,
      search: 5,
      direct: 5,
    }

    // Conversion Funnel
    const { count: verifiedUsers } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })
      .eq('is_verified_teacher', true)

    const { count: usersWithProducts } = await supabase
      .from('products')
      .select('seller_id', { count: 'exact', head: true })
      .eq('status', 'published')

    const { count: usersWithSales } = await supabase
      .from('order_items')
      .select('seller_id', { count: 'exact', head: true })

    return NextResponse.json({
      metrics: {
        totalUsers: totalUsers || 0,
        newSignups: newSignups || 0,
        sellerConversionRate: Math.round(sellerConversionRate * 10) / 10,
        activeUsers: activeUsers30d || 0,
      },
      charts: {
        userGrowthOverTime: usersByDate || [],
        signupSources,
        conversionFunnel: {
          visits: totalUsers || 0,
          signups: totalUsers || 0,
          verified: verifiedUsers || 0,
          firstProduct: usersWithProducts || 0,
          firstSale: usersWithSales || 0,
        },
      },
      timeRange,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/analytics/growth:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
