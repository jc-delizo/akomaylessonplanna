import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { ReviewCard } from '@/components/reviews/review-card'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getFullName } from '@/lib/utils/profile'

interface PageProps {
  params: Promise<{ username: string }>
  searchParams: Promise<{ product_id?: string; rating?: string; page?: string }>
}

export default async function SellerReviewsPage({
  params,
  searchParams,
}: PageProps) {
  const { username } = await params
  const { product_id, rating, page = '1' } = await searchParams
  const supabase = await createClient()

  // Get user by username
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, first_name, last_name, username, avg_rating, reviews_count')
    .eq('username', username)
    .single()

  if (userError || !user) {
    notFound()
  }

  // Fetch reviews
  const limit = 20
  const offset = (parseInt(page) - 1) * limit

  const paramsObj = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  })
  if (product_id) paramsObj.append('product_id', product_id)
  if (rating) paramsObj.append('rating', rating)

  // Use server-side fetch with absolute URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(
    `${baseUrl}/api/sellers/${username}/reviews?${paramsObj}`,
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
  const totalPages = Math.ceil(totalReviews / limit)
  const currentPage = parseInt(page)

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/sellers/${username}`}>
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Profile
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mb-2">
          Reviews for {getFullName(user)}
        </h1>
        {user.avg_rating && (
          <p className="text-gray-600">
            ⭐ {user.avg_rating.toFixed(1)} average rating ({user.reviews_count || 0} reviews)
          </p>
        )}
      </div>

      {/* Filters */}
      <Card className="p-4 mb-6">
        <div className="flex gap-4 items-center">
          <div>
            <label htmlFor="rating" className="text-sm text-gray-600 mr-2">
              Filter by Rating:
            </label>
            <select
              id="rating"
              value={rating || ''}
              onChange={(e) => {
                const params = new URLSearchParams()
                if (e.target.value) params.append('rating', e.target.value)
                if (product_id) params.append('product_id', product_id)
                window.location.href = `/sellers/${username}/reviews?${params}`
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm"
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Reviews List */}
      <div className="space-y-4 mb-6">
        {reviews.length > 0 ? (
          reviews.map((review: any) => (
            <ReviewCard
              key={review.id}
              review={review}
              showProductLink={true}
              productTitle={review.product?.title}
            />
          ))
        ) : (
          <Card className="p-8 text-center">
            <p className="text-gray-600">No reviews found</p>
          </Card>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Link
            href={`/sellers/${username}/reviews?${new URLSearchParams({
              ...(product_id && { product_id }),
              ...(rating && { rating }),
              page: Math.max(1, currentPage - 1).toString(),
            })}`}
          >
            <Button variant="outline" disabled={currentPage === 1}>
              Previous
            </Button>
          </Link>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Link
            href={`/sellers/${username}/reviews?${new URLSearchParams({
              ...(product_id && { product_id }),
              ...(rating && { rating }),
              page: Math.min(totalPages, currentPage + 1).toString(),
            })}`}
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
