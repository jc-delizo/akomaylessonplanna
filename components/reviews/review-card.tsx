'use client'

import { StarRating } from './star-rating'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/utils/date'
import { CheckCircle } from 'lucide-react'
import { useState } from 'react'

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

interface ReviewCardProps {
  review: Review
  showProductLink?: boolean
  productTitle?: string
  onReport?: (reviewId: string) => void
}

export function ReviewCard({
  review,
  showProductLink = false,
  productTitle,
  onReport,
}: ReviewCardProps) {
  const [showFullComment, setShowFullComment] = useState(false)
  const comment = review.comment || ''
  const shouldTruncate = comment.length > 200
  const displayComment = shouldTruncate && !showFullComment
    ? comment.substring(0, 200) + '...'
    : comment

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-semibold">{review.buyer?.name || 'Teacher'}</div>
              {review.verified_purchase && (
                <Badge variant="outline" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Verified Purchase
                </Badge>
              )}
            </div>
            {showProductLink && productTitle && (
              <p className="text-sm text-gray-600 mb-2">
                Reviewed: {productTitle}
              </p>
            )}
            <StarRating rating={review.rating} size="sm" />
          </div>
          <div className="text-sm text-gray-500">
            {formatRelativeTime(review.created_at)}
          </div>
        </div>

        {/* Comment */}
        {comment && (
          <div className="text-sm text-gray-700">
            <p>{displayComment}</p>
            {shouldTruncate && (
              <button
                onClick={() => setShowFullComment(!showFullComment)}
                className="text-purple-600 hover:underline mt-1 text-xs"
              >
                {showFullComment ? 'Show less' : 'Read more'}
              </button>
            )}
          </div>
        )}

        {/* Edited Badge */}
        {review.is_edited && (
          <p className="text-xs text-gray-500 italic">
            Edited {formatRelativeTime(review.updated_at)}
          </p>
        )}

        {/* Seller Response */}
        {review.seller_response && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-sm">Seller Response</span>
                </div>
                <p className="text-sm text-gray-700">{review.seller_response}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {onReport && (
          <div className="flex justify-end pt-2 border-t">
            <button
              onClick={() => onReport(review.id)}
              className="text-xs text-gray-500 hover:text-red-600"
            >
              Report
            </button>
          </div>
        )}
      </div>
    </Card>
  )
}
