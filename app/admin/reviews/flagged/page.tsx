import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Trash2 } from 'lucide-react'

async function getFlaggedReviews(
  supabase: Awaited<ReturnType<typeof createClient>>,
  status: string = 'pending'
) {
  // Query flagged reviews directly from Supabase
  let query = supabase
    .from('review_flags')
    .select(`
      *,
      review:reviews!review_flags_review_id_fkey(
        *,
        buyer:users!reviews_buyer_id_fkey(
          id,
          name,
          email
        ),
        product:products!reviews_product_id_fkey(
          id,
          title,
          seller_id,
          seller:users!products_seller_id_fkey(
            id,
            name,
            username
          )
        )
      ),
      reporter:users!review_flags_reporter_id_fkey(
        id,
        name
      )
    `, { count: 'exact' })
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: flags, error } = await query

  if (error) {
    // If table doesn't exist (migration not run), return empty array
    if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
      console.warn('review_flags table not found. Please run migration 008_feature_05_reviews.sql')
      return []
    }
    console.error('Error fetching flagged reviews:', error)
    throw new Error('Failed to fetch flagged reviews')
  }

  return flags || []
}

export default async function FlaggedReviewsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/reviews/flagged')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const flags = await getFlaggedReviews(supabase, 'pending')

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-orange-100 text-orange-700'
      case 'low':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Flagged Reviews</h1>
        <p className="text-gray-600 mt-1">Review and moderate flagged content</p>
      </div>

      <div className="space-y-4">
        {flags?.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No flagged reviews</p>
          </Card>
        ) : (
          flags?.map((flag: any) => {
            const review = flag.review
            const product = review?.product
            const seller = product?.seller

            return (
              <Card key={flag.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(flag.severity || 'medium')}>
                        {flag.severity || 'medium'} priority
                      </Badge>
                      <Badge variant="outline">{flag.flag_type}</Badge>
                      {flag.reporter && (
                        <span className="text-sm text-gray-500">
                          Reported by {flag.reporter?.name}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold mb-2">
                      Review for: {product?.title || 'Unknown Product'}
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-lg mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-bold">{review?.rating} ⭐</span>
                        <span className="text-sm text-gray-600">
                          by {review?.buyer?.name || 'Unknown'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{review?.comment}</p>
                    </div>
                    {flag.reason && (
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Flag reason:</span> {flag.reason}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 border-green-300 text-green-600 hover:bg-green-50"
                    size="sm"
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Dismiss Flag
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    size="sm"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Review
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
