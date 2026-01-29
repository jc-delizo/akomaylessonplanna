'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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

export function RecentlyViewedSection() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentlyViewed()
  }, [])

  const fetchRecentlyViewed = async () => {
    try {
      const response = await fetch('/api/recently-viewed?limit=6')
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error fetching recently viewed:', error)
    } finally {
      setLoading(false)
    }
  }

  // Only show if user has 3+ items
  if (loading || items.length < 3) {
    return null
  }

  return (
    <section className="py-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Recently Viewed</h2>
        <Link
          href="/recently-viewed"
          className="text-purple-600 hover:text-purple-700 font-medium text-sm"
        >
          See all recently viewed →
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {items.slice(0, 6).map((item) => (
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
          />
        ))}
      </div>
    </section>
  )
}
