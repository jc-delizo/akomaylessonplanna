/**
 * Response Time Tracker
 * Calculate and track seller response times
 */

import { createClient } from '@/lib/supabase/server'

/**
 * Calculate average response time for seller
 * Returns average in seconds, or null if no data
 */
export async function calculateAverageResponseTime(
  sellerId: string
): Promise<number | null> {
  const supabase = await createClient()

  // Get last 50 responses (rolling 30-day window)
  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString()

  const { data: responseTimes } = await supabase
    .from('seller_response_times')
    .select('response_seconds')
    .eq('seller_id', sellerId)
    .gte('created_at', thirtyDaysAgo)
    .order('created_at', { ascending: false })
    .limit(50)

  if (!responseTimes || responseTimes.length === 0) {
    return null
  }

  const average =
    responseTimes.reduce((sum, rt) => sum + rt.response_seconds, 0) /
    responseTimes.length

  return Math.round(average)
}

/**
 * Get response time badge text
 */
export function getResponseTimeBadge(responseTimeSeconds: number | null): {
  text: string
  range: string
} | null {
  if (responseTimeSeconds === null) {
    return null
  }

  const hours = responseTimeSeconds / 3600

  if (hours < 1) {
    return { text: '⚡ Lightning fast', range: '< 1 hour' }
  } else if (hours < 3) {
    return { text: '🚀 Very responsive', range: '< 3 hours' }
  } else if (hours < 6) {
    return { text: '✅ Responsive', range: '< 6 hours' }
  } else if (hours < 12) {
    return { text: 'Moderate', range: '< 12 hours' }
  } else if (hours < 24) {
    return { text: 'Slow', range: '< 24 hours' }
  } else {
    return { text: 'Very slow', range: '> 24 hours' }
  }
}

/**
 * Format response time for display
 */
export function formatResponseTime(responseTimeSeconds: number): string {
  const hours = Math.floor(responseTimeSeconds / 3600)
  const minutes = Math.floor((responseTimeSeconds % 3600) / 60)

  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
