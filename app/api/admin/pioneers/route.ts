import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/pioneers
 * Get current Pioneers (20-slot maximum)
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAdmin(request)
    if (!authResult.success) {
      return authResult.response
    }

    const supabase = await createClient()

    // Get all Pioneers
    const { data: pioneers, error } = await supabase
      .from('users')
      .select(`
        id,
        name,
        username,
        email,
        avatar_url,
        subscription_tier,
        is_pioneer,
        custom_commission_rate,
        created_at
      `)
      .eq('is_pioneer', true)
      .order('created_at', { ascending: true }) // Oldest first

    if (error) {
      console.error('Error fetching pioneers:', error)
      return NextResponse.json({ error: 'Failed to fetch pioneers' }, { status: 500 })
    }

    // Get performance metrics for each Pioneer
    const pioneersWithMetrics = await Promise.all(
      (pioneers || []).map(async (pioneer) => {
        // Product count
        const { count: productCount } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', pioneer.id)
          .eq('status', 'published')

        // Sales count
        const { count: salesCount } = await supabase
          .from('order_items')
          .select('*', { count: 'exact', head: true })
          .eq('seller_id', pioneer.id)

        // Revenue (last 30 days)
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const { data: recentSales } = await supabase
          .from('order_items')
          .select('price, commission')
          .eq('seller_id', pioneer.id)
          .gte('created_at', thirtyDaysAgo.toISOString())

        const revenue = recentSales?.reduce((sum, sale) => sum + Number(sale.price || 0), 0) || 0
        const commissionSaved = recentSales?.reduce(
          (sum, sale) => sum + (Number(sale.price || 0) * 0.05), // 5% savings (20% - 15%)
          0
        ) || 0

        // Average rating
        const { data: reviews } = await supabase
          .from('reviews')
          .select('rating')
          .in('product_id', (
            await supabase
              .from('products')
              .select('id')
              .eq('seller_id', pioneer.id)
          ).data?.map((p: any) => p.id) || [])

        const avgRating =
          reviews && reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
            : 0

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

    return NextResponse.json({
      pioneers: pioneersWithMetrics,
      total: pioneersWithMetrics.length,
      maxSlots: 20,
      availableSlots: 20 - pioneersWithMetrics.length,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/pioneers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
