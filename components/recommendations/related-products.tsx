'use client'

import { useState, useEffect } from 'react'
import { ProductCard } from '@/components/products/product-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
    name?: string
    first_name?: string
    last_name?: string
    username: string
    avatar_url?: string
    is_verified_teacher?: boolean
  }
  grade?: { id: string; name: string } | null
  subject?: { id: string; name: string; code?: string } | null
  class_type?: string | null
  strand?: { id: string; name: string; code?: string } | null
  sped_level?: { id: string; name: string } | null
}

interface RelatedProductsProps {
  productId: string
}

export function RelatedProducts({ productId }: RelatedProductsProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchRelated() {
      try {
        const response = await fetch(`/api/recommendations/related/${productId}`)
        if (response.ok) {
          const data = await response.json()
          setProducts(data.products || [])
        }
      } catch (err) {
        console.error('Error fetching related products:', err)
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchRelated()
    }
  }, [productId])

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-bold mb-4">You Might Also Like</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 rounded-lg h-64" />
          ))}
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return null
  }

  return (
    <div className="py-8 border-t mt-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">You Might Also Like</h2>
        <Link href="/marketplace/browse">
          <Button variant="outline" size="sm">
            View All
          </Button>
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} trafficSource="other" />
        ))}
      </div>
    </div>
  )
}
