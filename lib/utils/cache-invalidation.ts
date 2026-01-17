/**
 * Cache Invalidation Utilities
 * 
 * Invalidates seller dashboard metrics cache when relevant events occur
 * (new orders, sales, product updates, etc.)
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Invalidate dashboard cache for a seller
 * Called when:
 * - New order completed (affects revenue, sales metrics)
 * - Product updated (affects views, sales metrics)
 * - New review (affects rating metrics)
 */
export async function invalidateSellerDashboardCache(sellerId: string) {
  const supabase = await createClient()

  // Delete all cached metrics for this seller
  await supabase
    .from('seller_metrics_cache')
    .delete()
    .eq('seller_id', sellerId)

  // Also invalidate activity feed cache
  await supabase
    .from('seller_metrics_cache')
    .delete()
    .eq('seller_id', sellerId)
    .eq('metric_type', 'activity_feed')
}

/**
 * Invalidate specific metric cache
 */
export async function invalidateMetricCache(
  sellerId: string,
  metricType: string,
  timePeriod?: string
) {
  const supabase = await createClient()

  let query = supabase
    .from('seller_metrics_cache')
    .delete()
    .eq('seller_id', sellerId)
    .eq('metric_type', metricType)

  if (timePeriod) {
    query = query.eq('time_period', timePeriod)
  }

  await query
}
