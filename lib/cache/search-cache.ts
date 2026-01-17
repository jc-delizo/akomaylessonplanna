/**
 * Search results caching utility
 * 
 * Uses Redis for caching search results with 60-second TTL
 * Falls back to in-memory cache if Redis is not available
 */

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

// In-memory fallback cache
const memoryCache = new Map<string, CacheEntry<any>>()

// Cache TTL: 60 seconds (1 minute)
const CACHE_TTL_MS = 60 * 1000

/**
 * Generate cache key for search query
 */
export function generateSearchCacheKey(
  query: string,
  filters: Record<string, any>,
  sort: string
): string {
  const filterString = JSON.stringify(filters)
  return `search:${query}:${filterString}:${sort}`
}

/**
 * Get cached search results
 */
export async function getCachedSearchResults<T>(key: string): Promise<T | null> {
  try {
    // Try Redis first (if configured)
    if (process.env.REDIS_URL) {
      // TODO: Implement Redis client when Redis is set up
      // const redis = createRedisClient()
      // const cached = await redis.get(key)
      // if (cached) {
      //   return JSON.parse(cached)
      // }
    }

    // Fallback to in-memory cache
    const entry = memoryCache.get(key)
    if (entry && entry.expiresAt > Date.now()) {
      return entry.data
    }

    // Expired or not found
    if (entry) {
      memoryCache.delete(key)
    }

    return null
  } catch (error) {
    console.error('Error getting cached search results:', error)
    return null
  }
}

/**
 * Cache search results
 */
export async function setCachedSearchResults<T>(
  key: string,
  data: T,
  ttl: number = CACHE_TTL_MS
): Promise<void> {
  try {
    // Try Redis first (if configured)
    if (process.env.REDIS_URL) {
      // TODO: Implement Redis client when Redis is set up
      // const redis = createRedisClient()
      // await redis.setex(key, Math.floor(ttl / 1000), JSON.stringify(data))
      // return
    }

    // Fallback to in-memory cache
    memoryCache.set(key, {
      data,
      expiresAt: Date.now() + ttl
    })

    // Clean up expired entries periodically
    if (memoryCache.size > 1000) {
      const now = Date.now()
      for (const [k, v] of memoryCache.entries()) {
        if (v.expiresAt <= now) {
          memoryCache.delete(k)
        }
      }
    }
  } catch (error) {
    console.error('Error setting cached search results:', error)
  }
}

/**
 * Invalidate cache for a search query
 */
export async function invalidateSearchCache(key: string): Promise<void> {
  try {
    if (process.env.REDIS_URL) {
      // TODO: Implement Redis client when Redis is set up
      // const redis = createRedisClient()
      // await redis.del(key)
    }

    memoryCache.delete(key)
  } catch (error) {
    console.error('Error invalidating search cache:', error)
  }
}

/**
 * Invalidate all caches related to a product
 * Called when product status changes
 */
export async function invalidateProductCaches(productId: string): Promise<void> {
  try {
    // Invalidate all search caches (since product might appear in results)
    // In production, you'd want to be more selective
    if (process.env.REDIS_URL) {
      // TODO: Use Redis pattern matching to delete related keys
      // const redis = createRedisClient()
      // const keys = await redis.keys('search:*')
      // if (keys.length > 0) {
      //   await redis.del(...keys)
      // }
    }

    // Clear in-memory cache (simplified - clears all)
    // In production, you'd track which keys contain this product
    memoryCache.clear()
  } catch (error) {
    console.error('Error invalidating product caches:', error)
  }
}
