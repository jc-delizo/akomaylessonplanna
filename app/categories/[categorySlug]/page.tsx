'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { CategoryHero } from '@/components/categories/category-hero'
import { CategoryTabs } from '@/components/categories/category-tabs'
import { CategoryBreadcrumbs } from '@/components/categories/category-breadcrumbs'
import { FilterSidebar } from '@/components/products/filter-sidebar'
import { SearchResultsGrid } from '@/components/search/search-results-grid'
import { FilterChips } from '@/components/search/filter-chips'
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

export default function CategoryPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const categorySlug = params.categorySlug as string
  
  const [category, setCategory] = useState<any>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState(0)
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  // Build initial filters from URL params and category
  useEffect(() => {
    const initialFilters: Record<string, any> = {}
    searchParams.forEach((value, key) => {
      initialFilters[key] = value
    })
    
    // Auto-apply category filter
    if (categorySlug.startsWith('grade-')) {
      // Will be set after fetching category
    } else {
      // Product type category
      const productTypes: Record<string, string> = {
        'lesson-plans': 'lesson_plans',
        'exams': 'exams',
        'rpms': 'rpms',
        'posters': 'posters',
        'tarpaulins': 'tarpaulins'
      }
      if (productTypes[categorySlug]) {
        initialFilters.product_type = productTypes[categorySlug]
      }
    }
    
    setFilters(initialFilters)
  }, [categorySlug, searchParams])

  // Fetch category details
  useEffect(() => {
    async function fetchCategory() {
      try {
        const response = await fetch(`/api/categories/${categorySlug}`)
        if (response.ok) {
          const data = await response.json()
          setCategory(data)
        }
      } catch (err) {
        console.error('Error fetching category:', err)
      }
    }
    fetchCategory()
  }, [categorySlug])

  // Fetch products
  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true)
        setError(null)

        const queryParams = new URLSearchParams()
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== null && value !== undefined && value !== '') {
            queryParams.set(key, String(value))
          }
        })

        const response = await fetch(`/api/categories/${categorySlug}/products?${queryParams.toString()}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const data = await response.json()
        setProducts(data.products || [])
        setTotalResults(data.pagination?.total || 0)
      } catch (err) {
        console.error('Error fetching products:', err)
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [categorySlug, filters])

  const handleFilterChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters)
    
    const params = new URLSearchParams()
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null && value !== undefined && value !== '') {
        params.set(key, String(value))
      }
    })
    
    window.history.replaceState({}, '', `?${params.toString()}`)
  }

  const handleFilterRemove = (key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    handleFilterChange(newFilters)
  }

  const handleClearAll = () => {
    // Keep category filter, clear others
    const categoryFilter: Record<string, any> = {}
    if (filters.product_type) {
      categoryFilter.product_type = filters.product_type
    }
    if (filters.grade_id) {
      categoryFilter.grade_id = filters.grade_id
    }
    handleFilterChange(categoryFilter)
  }

  // Determine category-specific filters to show/hide
  const isProductTypeCategory = categorySlug !== 'grade-7' && !categorySlug.startsWith('grade-')
  const showFilters = {
    quarter: isProductTypeCategory && categorySlug === 'lesson-plans',
    weeks: isProductTypeCategory && categorySlug === 'lesson-plans',
    theme: !isProductTypeCategory || categorySlug === 'rpms' || categorySlug === 'posters'
  }

  // Get category name
  const categoryName = category?.name || categorySlug.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())

  // Breadcrumbs
  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Categories', href: '/categories' },
    { label: categoryName }
  ]

  return (
    <div className="container mx-auto px-4 py-6">
        {/* Breadcrumbs */}
        <CategoryBreadcrumbs items={breadcrumbs} />

        {/* Category Hero */}
        {category && (
          <CategoryHero
            title={categoryName}
            subtitle={`${category.product_count} resources from Filipino teachers`}
            productCount={category.product_count}
          />
        )}

        {/* Category Tabs (if applicable) */}
        {/* TODO: Add tabs for subcategories */}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
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
            <FilterChips
              filters={filters}
              onRemove={handleFilterRemove}
              onClearAll={handleClearAll}
              resultCount={totalResults}
            />

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading products...</p>
                </div>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <p className="text-red-600">{error}</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600">No products found in this category</p>
                <Button onClick={handleClearAll} variant="outline" className="mt-4">
                  Clear filters
                </Button>
              </div>
            ) : (
              <SearchResultsGrid
                products={products}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                trafficSource="category"
              />
            )}
          </main>
        </div>
      </div>
  )
}
