'use client'

import { ReviewCard } from './review-card'
import { ReviewSummaryCard } from './review-summary-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useState, useEffect } from 'react'

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
}

interface ReviewsSectionProps {
  productId: string
  averageRating?: number
  totalReviews?: number
  showTopN?: number
}

export function ReviewsSection({
  productId,
  averageRating,
  totalReviews = 0,
  showTopN = 3,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [distribution, setDistribution] = useState<{
    5: { count: number; percentage: number }
    4: { count: number; percentage: number }
    3: { count: number; percentage: number }
    2: { count: number; percentage: number }
    1: { count: number; percentage: number }
  } | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [productId])

  const fetchReviews = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/products/${productId}/reviews?sort=newest&limit=${showTopN}`)
      const data = await response.json()

      if (response.ok) {
        setReviews(data.reviews || [])
        calculateDistribution(data.reviews || [])
      }
    } catch (error) {
      console.error('Error fetching reviews:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateDistribution = (reviewsList: Review[]) => {
    const dist = {
      5: { count: 0, percentage: 0 },
      4: { count: 0, percentage: 0 },
      3: { count: 0, percentage: 0 },
      2: { count: 0, percentage: 0 },
      1: { count: 0, percentage: 0 },
    }

    reviewsList.forEach((review) => {
      const rating = review.rating as keyof typeof dist
      if (dist[rating]) {
        dist[rating].count++
      }
    })

    const total = reviewsList.length
    Object.keys(dist).forEach((rating) => {
      const key = parseInt(rating) as keyof typeof dist
      dist[key].percentage = total > 0 ? (dist[key].count / total) * 100 : 0
    })

    setDistribution(dist)
  }

  const handleReport = async (reviewId: string) => {
    // TODO: Implement report functionality
    const reason = prompt('Why are you reporting this review?')
    if (reason) {
      try {
        await fetch(`/api/reviews/${reviewId}/flag`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason }),
        })
        alert('Review reported. Thank you for your feedback.')
      } catch (error) {
        console.error('Error reporting review:', error)
        alert('Failed to report review. Please try again.')
      }
    }
  }

  if (isLoading) {
    return (
      <div className="py-8">
        <p className="text-gray-600 text-center">Loading reviews...</p>
      </div>
    )
  }

  if (totalReviews === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      {averageRating && (
        <ReviewSummaryCard
          averageRating={averageRating}
          totalReviews={totalReviews}
          distribution={distribution || undefined}
        />
      )}

      {/* Recent Reviews */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Reviews</h3>
        <div className="space-y-4">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                onReport={handleReport}
              />
            ))
          ) : (
            <p className="text-gray-600">No reviews to display</p>
          )}
        </div>
      </div>

      {/* See All Link */}
      {totalReviews > showTopN && (
        <div className="text-center">
          <Link href={`/products/${productId}/reviews`}>
            <Button variant="outline">
              See all {totalReviews} reviews
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
