'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { ReviewCard } from '@/components/reviews/review-card'
import { SellerResponseForm } from '@/components/reviews/seller-response-form'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Star,
  MessageSquare,
  AlertCircle,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Calendar,
  Info,
} from 'lucide-react'

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
      <div className="space-y-6 max-w-6xl">
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-4 w-24" />
            </Card>
          ))}
        </div>

        {/* Filter Skeleton */}
        <Card className="p-4 mb-6">
          <Skeleton className="h-10 w-64" />
        </Card>

        {/* Review Cards Skeleton */}
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-20 w-full" />
                <Separator />
                <Skeleton className="h-16 w-full" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!reviewsData) {
    return (
      <div className="space-y-6 max-w-6xl">
        <Card className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-destructive">
            Failed to Load Reviews
          </h2>
          <p className="text-muted-foreground mb-4">
            We couldn't load your reviews. Please try again.
          </p>
          <Button onClick={() => loadReviews()} variant="outline">
            Try Again
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Reviews</h1>
        <p className="text-muted-foreground">
          Manage and respond to reviews for your products
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Star className="w-5 h-5 text-primary" />
              </div>
              {reviewsData.total > 0 && (
                <Badge variant="secondary" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Total number of reviews left by buyers on your products.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-3xl font-bold mb-1">{reviewsData.total}</div>
          <div className="text-sm text-muted-foreground">Total Reviews</div>
        </Card>
        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <MessageSquare className="w-5 h-5 text-green-600" />
              </div>
              {reviewsData.responseRate >= 80 && (
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  Great
                </Badge>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Percentage of reviews you have replied to. Replying can build trust with buyers.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-3xl font-bold mb-1">
            {Math.round(reviewsData.responseRate)}%
          </div>
          <div className="text-sm text-muted-foreground">Response Rate</div>
        </Card>
        <Card className="p-6 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500/10 rounded-lg">
                <AlertCircle className="w-5 h-5 text-orange-600" />
              </div>
              {reviewsData.reviews.filter((r) => !r.seller_response).length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  Action Needed
                </Badge>
              )}
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Reviews that don&apos;t have a seller response yet. Consider replying to improve your response rate.</p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="text-3xl font-bold mb-1">
            {reviewsData.reviews.filter((r) => !r.seller_response).length}
          </div>
          <div className="text-sm text-muted-foreground">Unresponded</div>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <Tabs
            value={filter}
            onValueChange={(value) => setFilter(value as 'all' | 'unresponded')}
            className="w-full sm:w-auto"
          >
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                All Reviews
              </TabsTrigger>
              <TabsTrigger value="unresponded" className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Unresponded
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <Link href="/shop/reviews/analytics">
            <Button variant="outline" className="w-full sm:w-auto">
              <BarChart3 className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
          </Link>
        </div>
        <Separator />
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {reviewsData.reviews.length > 0 ? (
          reviewsData.reviews.map((review) => (
            <Card key={review.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="space-y-6">
                {/* Product Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${review.product.id}`}
                      className="text-lg font-semibold text-primary hover:underline inline-flex items-center gap-2 group"
                    >
                      {review.product.title}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </span>
                    </Link>
                    {review.product.cover_image_url && (
                      <div className="mt-2">
                        <img
                          src={review.product.cover_image_url}
                          alt={review.product.title}
                          className="w-16 h-16 object-cover rounded-md border"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                  </div>
                </div>

                <Separator />

                {/* Review Content */}
                <div>
                  <ReviewCard review={review} />
                </div>

                {/* Seller Response Section */}
                <Separator />
                {review.seller_response ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-sm">Your Response</span>
                        <Badge variant="secondary" className="text-xs">
                          Responded
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProduct(review.id)}
                      >
                        Edit
                      </Button>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                      <p className="text-sm text-foreground">{review.seller_response}</p>
                    </div>
                    {selectedProduct === review.id && (
                      <div className="mt-4 pt-4 border-t">
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
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                      <span className="font-semibold text-sm">No Response Yet</span>
                      <Badge variant="destructive" className="text-xs">
                        Action Needed
                      </Badge>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 rounded-lg p-4">
                      <SellerResponseForm
                        reviewId={review.id}
                        onSuccess={handleResponseSuccess}
                      />
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-muted rounded-full">
                <MessageSquare className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">No Reviews Found</h3>
                <p className="text-muted-foreground max-w-md">
                  {filter === 'unresponded'
                    ? "Great job! You've responded to all your reviews."
                    : "You don't have any reviews yet. Reviews will appear here once customers start rating your products."}
                </p>
              </div>
              {filter === 'all' && (
                <Link href="/shop/products">
                  <Button variant="outline">
                    View Your Products
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}
