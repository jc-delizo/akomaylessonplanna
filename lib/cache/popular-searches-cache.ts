/**
 * Popular searches pre-computation and caching
 * 
 * Pre-computes results for top 100 popular searches
 * Cached for 5 minutes
 */

import { createAdminClient } from '@/lib/supabase/admin'

const POPULAR_SEARCHES_CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes
const TOP_SEARCHES_LIMIT = 100

interface PopularSearchCache {
  query: string
  results: any[]
  cachedAt: number
}

const popularSearchesCache = new Map<string, PopularSearchCache>()

/**
 * Get popular searches (top 100 by search count)
 */
export async function getPopularSearches(): Promise<Array<{ query: string; count: number }>> {
  try {
    const adminClient = createAdminClient()

    const { data: searches, error } = await adminClient
      .from('search_queries')
      .select('query_text, search_count')
      .order('search_count', { ascending: false })
      .limit(TOP_SEARCHES_LIMIT)

    if (error) {
      throw error
    }

    return (searches || []).map((s: any) => ({
      query: s.query_text,
      count: s.search_count
    }))
  } catch (error) {
    console.error('Error getting popular searches:', error)
    return []
  }
}

/**
 * Pre-compute and cache results for popular searches
 * Should be called by a nightly cron job
 */
export async function precomputePopularSearches(): Promise<void> {
  try {
    const popularSearches = await getPopularSearches()

    // Pre-compute results for each popular search
    // Note: This is a simplified version - in production, you'd want to
    // execute actual search queries and cache the results
    for (const search of popularSearches.slice(0, 100)) {
      // Cache key
      const cacheKey = `popular:${search.query}`
      
      // Check if already cached and not expired
      const cached = popularSearchesCache.get(cacheKey)
      if (cached && cached.cachedAt + POPULAR_SEARCHES_CACHE_TTL_MS > Date.now()) {
        continue // Skip if still valid
      }

      // TODO: Execute search query and cache results
      // For now, just mark as cached
      popularSearchesCache.set(cacheKey, {
        query: search.query,
        results: [], // Would contain actual search results
        cachedAt: Date.now()
      })
    }

    console.log(`Pre-computed ${popularSearches.length} popular searches`)
  } catch (error) {
    console.error('Error pre-computing popular searches:', error)
  }
}

/**
 * Get cached results for a popular search
 */
export function getCachedPopularSearch(query: string): any[] | null {
  const cacheKey = `popular:${query}`
  const cached = popularSearchesCache.get(cacheKey)
  
  if (cached && cached.cachedAt + POPULAR_SEARCHES_CACHE_TTL_MS > Date.now()) {
    return cached.results
  }

  return null
}
