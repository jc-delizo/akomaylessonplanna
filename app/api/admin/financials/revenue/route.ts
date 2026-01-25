import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireSuperAdmin } from '@/lib/middleware/admin-auth'

/**
 * GET /api/admin/financials/revenue
 * Get revenue overview with charts (Super Admin only)
 * 
 * Query parameters:
 * - timeRange?: 'this_month' | 'last_30_days' | 'all_time'
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireSuperAdmin(request)
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
      case 'this_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case 'last_30_days':
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
        break
      case 'all_time':
        startDate = new Date(0)
        break
      default:
        startDate = new Date(now)
        startDate.setDate(startDate.getDate() - 30)
    }

    // Row 1: Revenue Metrics
    const { data: completedOrders } = await supabase
      .from('orders')
      .select('total_amount, total_commission')
      .eq('payment_status', 'completed')
      .gte('created_at', startDate.toISOString())

    const totalRevenue = completedOrders?.reduce(
      (sum, order) => sum + Number(order.total_commission || 0),
      0
    ) || 0

    const totalSales = completedOrders?.reduce(
      (sum, order) => sum + Number(order.total_amount || 0),
      0
    ) || 0

    const netProfit = totalRevenue
    const avgOrderValue = completedOrders && completedOrders.length > 0
      ? totalSales / completedOrders.length
      : 0

    // Row 2: Platform Metrics
    const totalOrders = completedOrders?.length || 0
    const commissionRate = totalSales > 0 ? (totalRevenue / totalSales) * 100 : 0

    const { count: activeSellers } = await supabase
      .from('order_items')
      .select('seller_id', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    const { count: pendingPayouts } = await supabase
      .from('withdrawal_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    // Revenue Over Time (for chart)
    const { data: ordersByDate } = await supabase
      .from('orders')
      .select('created_at, total_commission')
      .eq('payment_status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    // Revenue by Category (for chart)
    const { data: salesByCategory } = await supabase
      .from('order_items')
      .select(`
        price,
        product:products!order_items_product_id_fkey(product_type)
      `)
      .gte('created_at', startDate.toISOString())

    // Top Sellers by Revenue (for chart)
    const { data: topSellers } = await supabase
      .from('order_items')
      .select(`
        seller_id,
        price,
        seller:users!order_items_seller_id_fkey(id, first_name, last_name)
      `)
      .gte('created_at', startDate.toISOString())

    // Payment Method Split
    const { data: ordersByPayment } = await supabase
      .from('orders')
      .select('payment_method, total_amount')
      .eq('payment_status', 'completed')
      .gte('created_at', startDate.toISOString())

    return NextResponse.json({
      metrics: {
        // Row 1
        totalRevenue,
        totalSales,
        netProfit,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100,
        // Row 2
        totalOrders,
        commissionRate: Math.round(commissionRate * 10) / 10,
        activeSellers: activeSellers || 0,
        pendingPayouts: pendingPayouts || 0,
      },
      charts: {
        revenueOverTime: ordersByDate || [],
        revenueByCategory: salesByCategory || [],
        topSellers: topSellers || [],
        paymentMethodSplit: ordersByPayment || [],
      },
      timeRange,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/financials/revenue:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
