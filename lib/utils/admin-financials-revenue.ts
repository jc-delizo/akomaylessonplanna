import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get revenue overview. Safe to call from server components or API routes.
 */
export async function getRevenueData(
  supabase: SupabaseClient,
  timeRange: string = 'last_30_days'
) {
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

  const { data: completedOrders } = await supabase
    .from('orders')
    .select('total_amount, total_commission')
    .eq('payment_status', 'completed')
    .gte('created_at', startDate.toISOString())

  const totalRevenue =
    completedOrders?.reduce((sum, o) => sum + Number(o.total_commission || 0), 0) || 0
  const totalSales =
    completedOrders?.reduce((sum, o) => sum + Number(o.total_amount || 0), 0) || 0
  const avgOrderValue =
    completedOrders && completedOrders.length > 0
      ? totalSales / completedOrders.length
      : 0
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

  const { data: ordersByDate } = await supabase
    .from('orders')
    .select('created_at, total_commission')
    .eq('payment_status', 'completed')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  const { data: salesByCategory } = await supabase
    .from('order_items')
    .select('price, product:products!order_items_product_id_fkey(product_type)')
    .gte('created_at', startDate.toISOString())

  const { data: topSellers } = await supabase
    .from('order_items')
    .select(
      'seller_id, price, seller:users!order_items_seller_id_fkey(id, first_name, last_name)'
    )
    .gte('created_at', startDate.toISOString())

  const { data: ordersByPayment } = await supabase
    .from('orders')
    .select('payment_method, total_amount')
    .eq('payment_status', 'completed')
    .gte('created_at', startDate.toISOString())

  return {
    metrics: {
      totalRevenue,
      totalSales,
      netProfit: totalRevenue,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
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
  }
}
