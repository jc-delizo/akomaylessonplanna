import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ReviewsSection } from '@/components/reviews/reviews-section'
import { ReviewCard } from '@/components/reviews/review-card'
import { ReviewSummaryCard } from '@/components/reviews/review-summary-card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sort?: string; page?: string }>
}

export default async function ProductReviewsPage({
  params,
  searchParams,
}: PageProps) {
  const { id } = await params
  const { sort = 'newest', page = '1' } = await searchParams
  const supabase = await createClient()

  // Get product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, cover_image_url, avg_rating, reviews_count')
    .eq('id', id)
    .single()

  if (productError || !product) {
    notFound()
  }

  // Get reviews
  const limit = 20
  const offset = (parseInt(page) - 1) * limit

  // Use server-side fetch with absolute URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(
    `${baseUrl}/api/products/${id}/reviews?sort=${sort}&limit=${limit}&offset=${offset}`,
    { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  )

  const reviewsData = await response.json()
  const reviews = reviewsData.reviews || []
  const totalReviews = reviewsData.total || 0

  // Calculate distribution
  const distribution = {
    5: { count: 0, percentage: 0 },
    4: { count: 0, percentage: 0 },
    3: { count: 0, percentage: 0 },
    2: { count: 0, percentage: 0 },
    1: { count: 0, percentage: 0 },
  }

  reviews.forEach((review: { rating: number }) => {
    const rating = review.rating as keyof typeof distribution
    if (distribution[rating]) {
      distribution[rating].count++
    }
  })

  const total = reviews.length
  Object.keys(distribution).forEach((rating) => {
    const key = parseInt(rating) as keyof typeof distribution
    distribution[key].percentage = total > 0 ? (distribution[key].count / total) * 100 : 0
  })

  const totalPages = Math.ceil(totalReviews / limit)
  const currentPage = parseInt(page)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/products/${id}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Product
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mb-2">Reviews for {product.title}</h1>
        {product.cover_image_url && (
          <img
            src={product.cover_image_url}
            alt={product.title}
            className="w-24 h-24 object-cover rounded-lg mt-4"
          />
        )}
      </div>

      {/* Summary Card */}
      {product.avg_rating && (
        <div className="mb-6">
          <ReviewSummaryCard
            averageRating={product.avg_rating}
            totalReviews={product.reviews_count || 0}
            distribution={distribution}
          />
        </div>
      )}

      {/* Sorting */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {reviews.length} of {totalReviews} reviews
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-gray-600">
            Sort by:
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => {
              window.location.href = `/products/${id}/reviews?sort=${e.target.value}&page=1`
            }}
            className="px-3 py-1 border border-gray-300 rounded-md text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
          </select>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4 mb-6">
        {reviews.length > 0 ? (
          reviews.map((review: any) => (
            <ReviewCard key={review.id} review={review} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-600">No reviews found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/products/${id}/reviews?sort=${sort}&page=${Math.max(1, currentPage - 1)}`}
          >
            <Button variant="outline" disabled={currentPage === 1}>
              Previous
            </Button>
          </Link>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Link
            href={`/products/${id}/reviews?sort=${sort}&page=${Math.min(totalPages, currentPage + 1)}`}
          >
            <Button variant="outline" disabled={currentPage === totalPages}>
              Next
            </Button>
          </Link>
        </div>
      )}
    </div>
  )
}
