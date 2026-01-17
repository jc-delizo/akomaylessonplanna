'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { SearchBar } from '@/components/search/search-bar'
import { FilterChips } from '@/components/search/filter-chips'
import { SearchResultsGrid } from '@/components/search/search-results-grid'
import { FilterSidebar } from '@/components/products/filter-sidebar'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Product {
  id: string
  title: string
  description: string
  price: number
  cover_image_url?: string
  product_type: string
  status: string
  views_count: number
  sales_count: number
  avg_rating?: number
  reviews_count: number
  seller: {
    id: string
    name: string
    username: string
    avatar_url?: string
    is_verified_teacher: boolean
  }
  grade: {
    id: string
    name: string
  }
  subject: {
    id: string
    name: string
    code: string
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Build initial filters from URL params
  useEffect(() => {
    const initialFilters: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      initialFilters[key] = value
    })
    
    // Only update filters if they've actually changed to prevent infinite loops
    const filtersString = JSON.stringify(initialFilters)
    const currentFiltersString = JSON.stringify(filters)
    
    if (filtersString !== currentFiltersString) {
      setFilters(initialFilters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]) // filters intentionally excluded to prevent loop

  // Fetch products when filters change
  useEffect(() => {
    let cancelled = false
    let abortController: AbortController | null = null

    async function fetchProducts() {
      if (cancelled) return

      // Cancel previous request if still pending
      if (abortController) {
        abortController.abort()
      }
      abortController = new AbortController()

      try {
        setLoading(true)
        setError(null)

        // Build query string
        const queryParams = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            queryParams.set(key, String(value))
          }
        })

        const response = await fetch(`/api/search?${queryParams.toString()}`, {
          signal: abortController.signal,
        })
        
        if (cancelled) return
        
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json()
        
        if (!cancelled) {
          setProducts(data.products || [])
          setTotalResults(data.pagination?.total || 0)
          setSuggestions(data.suggestions || [])
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          // Request was cancelled, ignore
          return
        }
        if (!cancelled) {
          console.error('Error fetching products:', err)
          setError('Failed to load products')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchProducts()

    return () => {
      cancelled = true
      if (abortController) {
        abortController.abort()
      }
    }
  }, [filters])

  const handleFilterChange = (newFilters: Record<string, any>) => {
    // Update URL params first, then let the searchParams effect update filters
    // This prevents double updates and potential loops
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, String(value))
      }
    })
    
    // Use replace instead of push to avoid adding to history for filter changes
    router.replace(`/search?${params.toString()}`, { scroll: false })
    
    // Update filters immediately for responsive UI
    setFilters(newFilters)
  }

  const handleFilterRemove = (key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    handleFilterChange(newFilters)
  }

  const handleClearAll = () => {
    handleFilterChange({})
  }

  const handleSearch = (query: string) => {
    handleFilterChange({ ...filters, q: query })
  }

  const query = searchParams.get('q') || ''

  return (
    <>
      {/* Header with Search */}
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-4">
            <Link href="/marketplace" className="text-purple-600 hover:underline inline-flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Marketplace
            </Link>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex-1">
              <h1 className="text-2xl md:text-3xl font-bold mb-1">Search Products</h1>
              {query && (
                <p className="text-gray-600 text-sm">
                  Results for "{query}"
                </p>
              )}
            </div>
            {/* Enhanced Search Bar */}
            <div className="flex-1 max-w-2xl">
              <SearchBar
                initialQuery={query}
                onSearch={handleSearch}
                placeholder="Search lesson plans, exams, RPMS..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              {/* Mobile Filter Toggle */}
              <div className="mb-4 lg:hidden">
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg font-medium flex items-center justify-between"
                >
                  <span>🔍 Filters & Sort</span>
                  <svg 
                    className={`w-5 h-5 transition-transform ${mobileSidebarOpen ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
              {/* Filter Sidebar */}
              {/* Mobile Drawer */}
              {mobileSidebarOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                  <div 
                    className="absolute inset-0 bg-black/50"
                    onClick={() => setMobileSidebarOpen(false)}
                  />
                  <div className="absolute left-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-xl overflow-y-auto">
                    <FilterSidebar
                      onFilterChange={handleFilterChange}
                      initialFilters={filters}
                      isMobile={true}
                      onClose={() => setMobileSidebarOpen(false)}
                      resultCount={totalResults}
                    />
                  </div>
                </div>
              )}
              {/* Desktop Sidebar */}
              <div className="hidden lg:block">
                <FilterSidebar
                  onFilterChange={handleFilterChange}
                  initialFilters={filters}
                  resultCount={totalResults}
                />
              </div>
            </div>
          </aside>

          {/* Products Grid */}
          <main className="lg:col-span-3">
            {/* Filter Chips */}
            <FilterChips
              filters={filters}
              onRemove={handleFilterRemove}
              onClearAll={handleClearAll}
              resultCount={totalResults}
            />

            {/* Loading State */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto w-24 h-24 text-red-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold mb-2">Error loading products</h3>
                <p className="text-gray-600">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto w-24 h-24 text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="text-xl font-semibold mb-2">No products found</h3>
                <p className="text-gray-600 mb-4">
                  {query ? `No results found for "${query}"` : 'Try adjusting your filters or search terms'}
                </p>
                
                {/* "Did you mean?" Suggestions */}
                {suggestions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Did you mean?</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {suggestions.map((suggestion, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => handleFilterChange({ ...filters, q: suggestion })}
                        >
                          {suggestion}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={handleClearAll}
                  variant="outline"
                >
                  Clear all filters
                </Button>
              </div>
            ) : (
              <SearchResultsGrid
                products={products}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                searchQuery={query}
              />
            )}

            {/* Pagination */}
            {!loading && products.length > 0 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={parseInt(filters.page || '1') === 1}
                  onClick={() => {
                    const page = parseInt(filters.page || '1')
                    handleFilterChange({ ...filters, page: Math.max(1, page - 1) })
                  }}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-600">
                  Page {filters.page || 1} of {Math.ceil(totalResults / parseInt(filters.limit || '24'))}
                </span>
                <Button
                  variant="outline"
                  disabled={parseInt(filters.page || '1') >= Math.ceil(totalResults / parseInt(filters.limit || '24'))}
                  onClick={() => {
                    const page = parseInt(filters.page || '1')
                    const totalPages = Math.ceil(totalResults / parseInt(filters.limit || '24'))
                    handleFilterChange({ ...filters, page: Math.min(totalPages, page + 1) })
                  }}
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  )
}
