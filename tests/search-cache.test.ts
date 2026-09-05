import { describe, expect, it } from 'vitest'
import { generateSearchCacheKey } from '../lib/cache/search-cache'

describe('generateSearchCacheKey', () => {
  const filters = {
    gradeId: null,
    productType: 'lesson_plans',
    quarter: '1',
  }

  it('uses page and page size so paginated results cannot share a cache entry', () => {
    const firstPage = generateSearchCacheKey('', filters, 'newest', { page: 1, limit: 24 })
    const secondPage = generateSearchCacheKey('', filters, 'newest', { page: 2, limit: 24 })
    const largerPage = generateSearchCacheKey('', filters, 'newest', { page: 1, limit: 100 })

    expect(firstPage).not.toBe(secondPage)
    expect(firstPage).not.toBe(largerPage)
  })

  it('is stable for the same query, filters, sort, and pagination', () => {
    const firstKey = generateSearchCacheKey('math', filters, 'relevance', { page: 3, limit: 12 })
    const secondKey = generateSearchCacheKey('math', filters, 'relevance', { page: 3, limit: 12 })

    expect(firstKey).toBe(secondKey)
  })
})
