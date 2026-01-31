'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/products/product-card'

interface RecentlyViewedItem {
  id: string
  viewed_at: string
  product: {
    id: string
    title: string
    price: number
    cover_image_url?: string
    seller: {
      id: string
      name?: string
      first_name?: string
      last_name?: string
      username: string
    }
    grade?: { id: string; name: string } | null
    subject?: { id: string; name: string } | null
    class_type?: string | null
    strand?: { id: string; name: string; code?: string } | null
    sped_level?: { id: string; name: string } | null
    subject_ids?: string[]
    quarter?: number
    weeks?: number[]
  }
}

export function RecentlyViewedPageContent() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [filter, setFilter] = useState<'all' | 'week' | 'month'>('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentlyViewed()
  }, [filter])

  const fetchRecentlyViewed = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/recently-viewed?filter=${filter}&limit=20`)
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error fetching recently viewed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b mb-6">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'all'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          All time
        </button>
        <button
          onClick={() => setFilter('week')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'week'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          This week
        </button>
        <button
          onClick={() => setFilter('month')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            filter === 'month'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          This month
        </button>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">
          Loading recently viewed items...
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">
            No recently viewed items yet
          </p>
          <p className="text-gray-400 text-sm">
            Start browsing products to see them here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              product={{
                id: item.product.id,
                title: item.product.title,
                description: '',
                price: item.product.price,
                cover_image_url: item.product.cover_image_url,
                product_type: '',
                seller: item.product.seller,
                grade: item.product.grade ?? null,
                subject: item.product.subject ?? null,
                class_type: item.product.class_type ?? null,
                strand: item.product.strand ?? null,
                sped_level: item.product.sped_level ?? null,
                subject_ids: item.product.subject_ids,
                quarter: item.product.quarter,
                weeks: item.product.weeks,
              }}
              trafficSource="other"
            />
          ))}
        </div>
      )}
    </div>
  )
}
