'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { ReviewCard } from '@/components/reviews/review-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

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
  }
}

interface SellerReviewsSectionProps {
  username: string
}

export function SellerReviewsSection({ username }: SellerReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadReviews()
  }, [username])

  const loadReviews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/sellers/${username}/reviews?limit=3`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews || [])
        setTotal(data.total || 0)
      }
    } catch (error) {
      console.error('Error loading reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading reviews...</p>
        </CardContent>
      </Card>
    )
  }

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No reviews yet</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Reviews ({total} total)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border-b last:border-b-0 pb-4 last:pb-0">
              <Link
                href={`/products/${review.product.id}`}
                className="text-sm text-purple-600 hover:underline font-semibold mb-2 block"
              >
                {review.product.title}
              </Link>
              <ReviewCard review={review} showProductLink={false} />
            </div>
          ))}
        </div>
        {total > 3 && (
          <div className="mt-4 text-center">
            <Link href={`/sellers/${username}/reviews`}>
              <Button variant="outline">View all {total} reviews</Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
