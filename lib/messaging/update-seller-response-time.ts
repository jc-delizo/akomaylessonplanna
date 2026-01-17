/**
 * Update Seller Response Time
 * Updates the users.response_time_hours field based on calculated average
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { calculateAverageResponseTime } from './response-time-tracker'

/**
 * Update seller's response_time_hours in users table
 * Called periodically or after new response time is recorded
 */
export async function updateSellerResponseTime(sellerId: string): Promise<void> {
  const supabase = createAdminClient()

  // Calculate average response time
  const avgSeconds = await calculateAverageResponseTime(sellerId)

  if (avgSeconds === null) {
    // No data yet, don't update
    return
  }

  // Convert to hours (round to 1 decimal)
  const avgHours = Math.round((avgSeconds / 3600) * 10) / 10

  // Update users table
  await supabase
    .from('users')
    .update({
      response_time_hours: avgHours,
    })
    .eq('id', sellerId)
}

/**
 * Update response time for all sellers (batch job)
 * Can be called via cron job or admin action
 */
export async function updateAllSellerResponseTimes(): Promise<number> {
  const supabase = createAdminClient()

  // Get all sellers
  const { data: sellers } = await supabase
    .from('users')
    .select('id')
    .eq('can_sell', true)
    .eq('role', 'seller')

  if (!sellers || sellers.length === 0) {
    return 0
  }

  // Update each seller
  let updated = 0
  for (const seller of sellers) {
    try {
      await updateSellerResponseTime(seller.id)
      updated++
    } catch (error) {
      console.error(`Error updating response time for seller ${seller.id}:`, error)
    }
  }

  return updated
}
