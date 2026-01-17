'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
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
      name: string
      username: string
    }
    grade: {
      id: string
      name: string
    }
    subject: {
      id: string
      name: string
    }
  }
}

export function RecentlyViewedSidebar() {
  const [items, setItems] = useState<RecentlyViewedItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRecentlyViewed()
  }, [])

  const fetchRecentlyViewed = async () => {
    try {
      const response = await fetch('/api/recently-viewed?limit=4')
      const data = await response.json()
      setItems(data.items || [])
    } catch (error) {
      console.error('Error fetching recently viewed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || items.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold mb-4">You recently viewed:</h3>
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/products/${item.product.id}`}
            className="flex-shrink-0 w-48 md:w-56"
          >
            <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
              {item.product.cover_image_url && (
                <div className="relative w-full h-32 bg-gray-100">
                  <Image
                    src={item.product.cover_image_url}
                    alt={item.product.title}
                    fill
                    className="object-cover"
                  />
                </div>
              )}
              <div className="p-3">
                <h4 className="font-medium text-sm line-clamp-2 mb-1">
                  {item.product.title}
                </h4>
                <p className="text-purple-600 font-semibold text-sm">
                  ₱{item.product.price.toFixed(2)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
