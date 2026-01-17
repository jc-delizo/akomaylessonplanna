'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StarRating } from '@/components/reviews/star-rating'
import { formatRelativeTime } from '@/lib/utils/date'
import { useRouter } from 'next/navigation'

interface FlaggedReviewCardProps {
  flag: {
    id: string
    flag_type: string
    flag_source: string
    reason: string
    status: string
    created_at: string
    review: {
      id: string
      rating: number
      comment?: string | null
      verified_purchase: boolean
      created_at: string
      buyer: {
        id: string
        name: string
        email: string
      } | null
      product: {
        id: string
        title: string
        seller: {
          id: string
          name: string
          username: string
        }
      }
    }
    reporter?: {
      id: string
      name: string
    } | null
  }
}

export function FlaggedReviewCard({ flag }: FlaggedReviewCardProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const router = useRouter()

  const handleModerate = async (action: 'approve' | 'delete') => {
    if (!confirm(`Are you sure you want to ${action === 'approve' ? 'approve' : 'delete'} this review?`)) {
      return
    }

    setIsProcessing(true)

    try {
      const response = await fetch(`/api/admin/reviews/${flag.review.id}/moderate`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Failed to moderate review')
      }

      router.refresh()
    } catch (error) {
      console.error('Error moderating review:', error)
      alert('Failed to moderate review. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const getFlagTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'profanity':
        return 'bg-red-100 text-red-800'
      case 'spam':
        return 'bg-orange-100 text-orange-800'
      case 'excessive_caps':
        return 'bg-yellow-100 text-yellow-800'
      case 'excessive_punctuation':
        return 'bg-yellow-100 text-yellow-800'
      case 'manual_report':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Flag Info */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={getFlagTypeBadgeColor(flag.flag_type)}>
                {flag.flag_type.replace('_', ' ')}
              </Badge>
              <Badge variant="outline">
                {flag.flag_source}
              </Badge>
              <Badge variant={flag.status === 'pending' ? 'default' : 'outline'}>
                {flag.status}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mb-1">
              <strong>Reason:</strong> {flag.reason}
            </p>
            <p className="text-xs text-gray-500">
              Flagged {formatRelativeTime(flag.created_at)}
              {flag.reporter && ` by ${flag.reporter.name}`}
            </p>
          </div>
        </div>

        {/* Review Content */}
        <div className="border-t pt-4">
          <div className="mb-2">
            <p className="text-sm text-gray-600 mb-1">
              <strong>Product:</strong>{' '}
              <a
                href={`/products/${flag.review.product.id}`}
                className="text-purple-600 hover:underline"
              >
                {flag.review.product.title}
              </a>
            </p>
            <p className="text-sm text-gray-600">
              <strong>Seller:</strong>{' '}
              <a
                href={`/sellers/${flag.review.product.seller.username}`}
                className="text-purple-600 hover:underline"
              >
                {flag.review.product.seller.name}
              </a>
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <span className="font-semibold">
                {flag.review.buyer?.name || 'Teacher'}
              </span>
              {flag.review.verified_purchase && (
                <Badge variant="outline" className="text-xs">
                  Verified Purchase
                </Badge>
              )}
            </div>
            <StarRating rating={flag.review.rating} size="sm" />
            {flag.review.comment && (
              <p className="text-sm text-gray-700 mt-2">{flag.review.comment}</p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Posted {formatRelativeTime(flag.review.created_at)}
            </p>
          </div>
        </div>

        {/* Actions */}
        {flag.status === 'pending' && (
          <div className="flex gap-3 pt-4 border-t">
            <Button
              onClick={() => handleModerate('approve')}
              disabled={isProcessing}
              variant="outline"
              className="flex-1"
            >
              Approve
            </Button>
            <Button
              onClick={() => handleModerate('delete')}
              disabled={isProcessing}
              variant="destructive"
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        )}
      </div>
    </Card>
  )
}
