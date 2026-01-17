import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { ReviewSubmissionForm } from '@/components/reviews/review-submission-form'
import { ReviewEligibilityCheck } from '@/components/reviews/review-eligibility-check'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

interface PageProps {
  params: Promise<{ productId: string }>
}

export default async function ReviewSubmissionPage({
  params,
}: PageProps) {
  const { productId } = await params
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Get product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, title, cover_image_url, description')
    .eq('id', productId)
    .single()

  if (productError || !product) {
    notFound()
  }

  // Check if user already reviewed
  const { data: existingReview } = await supabase
    .from('reviews')
    .select('id')
    .eq('product_id', productId)
    .eq('buyer_id', user.id)
    .single()

  if (existingReview) {
    redirect(`/products/${productId}/reviews`)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Link href="/library">
        <Button variant="ghost" className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Library
        </Button>
      </Link>

      <Card className="p-6">
        <ReviewEligibilityCheck productId={productId}>
          {(isEligible) => (
            <>
              {isEligible ? (
                <ReviewSubmissionForm
                  productId={productId}
                  productTitle={product.title}
                  onSuccess={() => {
                    redirect(`/products/${productId}/reviews`)
                  }}
                  onCancel={() => {
                    redirect('/library')
                  }}
                />
              ) : null}
            </>
          )}
        </ReviewEligibilityCheck>
      </Card>
    </div>
  )
}
