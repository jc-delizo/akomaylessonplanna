'use client'

import { StarRating } from './star-rating'
import { Card } from '@/components/ui/card'

interface RatingDistribution {
  5: { count: number; percentage: number }
  4: { count: number; percentage: number }
  3: { count: number; percentage: number }
  2: { count: number; percentage: number }
  1: { count: number; percentage: number }
}

interface ReviewSummaryCardProps {
  averageRating: number
  totalReviews: number
  distribution?: RatingDistribution
}

export function ReviewSummaryCard({
  averageRating,
  totalReviews,
  distribution,
}: ReviewSummaryCardProps) {
  const renderStars = (count: number) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count)
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="text-4xl font-bold">
            {averageRating.toFixed(1)}
          </div>
          <div className="flex-1">
            <StarRating rating={averageRating} size="lg" />
            <p className="text-sm text-gray-600 mt-1">
              {totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </div>

        {/* Distribution Chart */}
        {distribution && (
          <div className="space-y-2 pt-4 border-t">
            {[5, 4, 3, 2, 1].map((rating) => {
              const data = distribution[rating as keyof RatingDistribution]
              const percentage = data.percentage
              const barWidth = Math.max(percentage, 2) // Minimum 2% for visibility

              return (
                <div key={rating} className="flex items-center gap-3 text-sm">
                  <div className="w-20 text-left">
                    <span className="text-yellow-500">{renderStars(rating)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                      <span className="text-gray-600 w-20 text-right">
                        {data.count} ({percentage.toFixed(0)}%)
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Card>
  )
}
