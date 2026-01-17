/**
 * Track search impressions for analytics
 * 
 * Called when products appear in search results
 * Runs asynchronously to not slow down search response
 */

import { createAdminClient } from '@/lib/supabase/admin'

interface SearchImpression {
  productId: string
  searchTerm: string
  position: number
}

/**
 * Track search impressions for multiple products
 * This should be called after search results are returned
 */
export async function trackSearchImpressions(
  impressions: SearchImpression[]
): Promise<void> {
  if (impressions.length === 0) {
    return
  }

  try {
    const adminClient = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Upsert impressions for each product
    for (const impression of impressions) {
      try {
        // Check if record exists for today
        const { data: existing } = await adminClient
          .from('search_analytics')
          .select('id, impressions, avg_position')
          .eq('product_id', impression.productId)
          .eq('search_term', impression.searchTerm)
          .eq('date', today)
          .single()

        if (existing) {
          // Update existing record
          const newImpressions = (existing.impressions || 0) + 1
          // Update average position (weighted average)
          const currentAvg = parseFloat(existing.avg_position) || impression.position
          const newAvg = ((currentAvg * (newImpressions - 1)) + impression.position) / newImpressions

          await adminClient
            .from('search_analytics')
            .update({
              impressions: newImpressions,
              avg_position: newAvg,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)
        } else {
          // Create new record
          await adminClient
            .from('search_analytics')
            .insert({
              product_id: impression.productId,
              search_term: impression.searchTerm,
              impressions: 1,
              avg_position: impression.position,
              date: today
            })
        }
      } catch (err) {
        // Silently fail for individual impressions
        console.error(`Error tracking impression for product ${impression.productId}:`, err)
      }
    }
  } catch (error) {
    // Silently fail - analytics shouldn't break search
    console.error('Error tracking search impressions:', error)
  }
}

/**
 * Track a search click (when user clicks on a product from search results)
 */
export async function trackSearchClick(
  productId: string,
  searchTerm: string
): Promise<void> {
  try {
    const adminClient = createAdminClient()
    const today = new Date().toISOString().split('T')[0]

    // Find or create analytics record
    const { data: existing } = await adminClient
      .from('search_analytics')
      .select('id, clicks')
      .eq('product_id', productId)
      .eq('search_term', searchTerm)
      .eq('date', today)
      .single()

    if (existing) {
      // Update clicks
      await adminClient
        .from('search_analytics')
        .update({
          clicks: (existing.clicks || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id)
    } else {
      // Create new record with 1 click
      await adminClient
        .from('search_analytics')
        .insert({
          product_id: productId,
          search_term: searchTerm,
          impressions: 0,
          clicks: 1,
          date: today
        })
    }
  } catch (error) {
    // Silently fail - analytics shouldn't break user experience
    console.error('Error tracking search click:', error)
  }
}
