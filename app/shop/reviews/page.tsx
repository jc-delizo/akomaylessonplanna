'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ReviewCard } from '@/components/reviews/review-card'
import { SellerResponseForm } from '@/components/reviews/seller-response-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Review {
  id: string
  rating: number
  comment?: string | null
  verified_purchase: boolean
  seller_response?: string | null
  is_edited: boolean
  created_at: string
  updated_at: string
  buyer: {
    id: string
    name: string
    avatar_url?: string | null
  } | null
  product: {
    id: string
    title: string
    cover_image_url?: string
    seller_id: string
  }
}

interface ReviewsData {
  reviews: Review[]
  total: number
  responseRate: number
}

export default function SellerReviewsPage() {
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'unresponded'>('all')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadReviews()
  }, [filter, selectedProduct])

  const loadReviews = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        status: filter,
        limit: '20',
      })
      if (selectedProduct) {
        params.append('product_id', selectedProduct)
      }

      const response = await fetch(`/api/seller/reviews?${params}`)
      if (!response.ok) {
        throw new Error('Failed to load reviews')
      }

      const data = await response.json()
      setReviewsData(data)
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResponseSuccess = () => {
    loadReviews()
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Loading reviews...</p>
      </div>
    )
  }

  if (!reviewsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-red-600">Failed to load reviews</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Reviews</h1>
        <p className="text-gray-600">
          Manage and respond to reviews for your products
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold">{reviewsData.total}</div>
          <div className="text-sm text-gray-600">Total Reviews</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {Math.round(reviewsData.responseRate)}%
          </div>
          <div className="text-sm text-gray-600">Response Rate</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold">
            {reviewsData.reviews.filter((r) => !r.seller_response).length}
          </div>
          <div className="text-sm text-gray-600">Unresponded</div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label htmlFor="filter" className="text-sm text-gray-600 mr-2">
              Filter:
            </label>
            <select
              id="filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unresponded')}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Reviews</option>
              <option value="unresponded">Unresponded</option>
            </select>
          </div>
          <Link href="/shop/reviews/analytics">
            <Button variant="outline">View Analytics</Button>
          </Link>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviewsData.reviews.length > 0 ? (
          reviewsData.reviews.map((review) => (
            <Card key={review.id} className="p-4">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/products/${review.product.id}`}
                      className="text-purple-600 hover:underline font-semibold"
                    >
                      {review.product.title}
                    </Link>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>

                <ReviewCard review={review} />

                {/* Seller Response Section */}
                {review.seller_response ? (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold text-sm">Your Response</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProduct(review.id)}
                      >
                        Edit
                      </Button>
                    </div>
                    <p className="text-sm text-gray-700">{review.seller_response}</p>
                    {selectedProduct === review.id && (
                      <div className="mt-4">
                        <SellerResponseForm
                          reviewId={review.id}
                          initialResponse={review.seller_response}
                          onSuccess={handleResponseSuccess}
                          onCancel={() => setSelectedProduct(null)}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 pt-4 border-t">
                    <SellerResponseForm
                      reviewId={review.id}
                      onSuccess={handleResponseSuccess}
                    />
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No reviews found</p>
          </Card>
        )}
      </div>
    </div>
  )
}
