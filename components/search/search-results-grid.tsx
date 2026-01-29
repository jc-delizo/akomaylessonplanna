'use client'

import { useState } from 'react'
import { Grid3x3, List } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductCard } from '@/components/products/product-card'

interface Product {
  id: string
  title: string
  description: string
  price: number
  cover_image_url?: string
  product_type: string
  avg_rating?: number
  reviews_count?: number
  sales_count?: number
  views_count?: number
  seller: {
    id: string
    name: string
    username: string
    avatar_url?: string
    is_verified_teacher?: boolean
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

interface SearchResultsGridProps {
  products: Product[]
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  searchQuery?: string
}

export function SearchResultsGrid({ 
  products, 
  viewMode: controlledViewMode,
  onViewModeChange,
  searchQuery
}: SearchResultsGridProps) {
  const [internalViewMode, setInternalViewMode] = useState<'grid' | 'list'>('grid')
  const viewMode = controlledViewMode || internalViewMode
  const setViewMode = onViewModeChange || setInternalViewMode

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No products found</p>
      </div>
    )
  }

  return (
    <div>
      {/* View Toggle (Desktop only) */}
      <div className="hidden md:flex items-center justify-end gap-2 mb-4">
        <Button
          variant={viewMode === 'grid' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('grid')}
          className="gap-2"
        >
          <Grid3x3 className="w-4 h-4" />
          Grid
        </Button>
        <Button
          variant={viewMode === 'list' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="gap-2"
        >
          <List className="w-4 h-4" />
          List
        </Button>
      </div>

      {/* Products Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} searchQuery={searchQuery} />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <ProductCard product={product} searchQuery={searchQuery} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
