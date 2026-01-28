'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { FilterSidebar } from '@/components/products/filter-sidebar'
import { FilterChips } from '@/components/search/filter-chips'
import { SearchResultsGrid } from '@/components/search/search-results-grid'
import { Button } from '@/components/ui/button'
import { PageLoader } from '@/components/ui/page-loader'

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

export default function BrowseProductsPage() {
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

  // Build initial filters from URL params (parse weeks and modalities as arrays)
  useEffect(() => {
    const initialFilters: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      if (key === 'weeks' && value) {
        initialFilters[key] = value.split(',').map((w) => parseInt(w.trim(), 10)).filter((n) => !Number.isNaN(n) && n >= 1 && n <= 9)
      } else if (key === 'modalities' && value) {
        initialFilters[key] = value.split(',').map((m) => m.trim()).filter(Boolean)
      } else if (key === 'subject_ids' && value) {
        initialFilters[key] = value.split(',').map((s) => s.trim()).filter(Boolean)
      } else {
        initialFilters[key] = value
      }
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

        // Build query string (serialize arrays as comma-separated for weeks, modalities)
        const queryParams = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value === null || value === undefined || value === '') return
          if (Array.isArray(value)) {
            if (value.length > 0) queryParams.set(key, value.join(','))
          } else {
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
          setTotalResults(data.pagination?.total || data.total || 0)
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
    // Update URL params (serialize arrays as comma-separated for weeks, modalities)
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value === null || value === undefined || value === '') return
      if (Array.isArray(value)) {
        if (value.length > 0) params.set(key, value.join(','))
      } else {
        params.set(key, String(value))
      }
    })
    router.replace(`/marketplace/browse?${params.toString()}`, { scroll: false })
    setFilters(newFilters)
  }

  const handleFilterRemove = (key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    if (key === 'document_type') delete newFilters.specific_type
    if (key === 'subject_ids') delete newFilters.subject_id
    if (key === 'class_type') {
      delete newFilters.learner_path
      delete newFilters.strand_id
      delete newFilters.sped_level_id
    }
    handleFilterChange(newFilters)
  }

  const handleClearAll = () => {
    handleFilterChange({})
  }


  return (
    <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
          {/* Filter Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <div className="mb-4 lg:hidden">
                <button
                  onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                  className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg font-medium flex items-center justify-between"
                >
                  <span>🔍 Filters & Sort</span>
                  <svg className={`w-5 h-5 transition-transform ${mobileSidebarOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
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
          <main className="lg:col-span-6">
            {/* Filter Chips */}
            <FilterChips
              filters={filters}
              onRemove={handleFilterRemove}
              onClearAll={handleClearAll}
              resultCount={totalResults}
            />

            {loading ? (
              <PageLoader message="Loading products..." />
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
                  {(filters.q || filters.search) ? `No results found for "${filters.q || filters.search}"` : 'Try adjusting your filters or search terms'}
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
                searchQuery={filters.q || filters.search}
              />
            )}
          </main>
        </div>
      </div>
  )
}
