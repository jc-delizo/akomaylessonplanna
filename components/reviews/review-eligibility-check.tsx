'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Download, ShoppingCart } from 'lucide-react'

interface ReviewEligibilityCheckProps {
  productId: string
  children: (isEligible: boolean, isLoading: boolean) => React.ReactNode
}

export function ReviewEligibilityCheck({
  productId,
  children,
}: ReviewEligibilityCheckProps) {
  const [isEligible, setIsEligible] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    checkEligibility()
  }, [productId])

  const checkEligibility = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setIsEligible(false)
        setIsLoading(false)
        return
      }

      // Check eligibility via API
      const response = await fetch(`/api/products/${productId}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rating: 1, // Dummy rating for eligibility check
          comment: '',
        }),
      })

      const data = await response.json()

      if (response.status === 403 && data.code === 'NOT_ELIGIBLE') {
        setIsEligible(false)
      } else if (response.ok || response.status === 400) {
        // 400 might mean already reviewed, but user is eligible
        setIsEligible(true)
      } else {
        setIsEligible(false)
        setError(data.error || 'Unable to check eligibility')
      }
    } catch (err) {
      console.error('Error checking eligibility:', err)
      setError('Failed to check eligibility')
      setIsEligible(false)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">Checking eligibility...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={checkEligibility} variant="outline">
          Try Again
        </Button>
      </div>
    )
  }

  if (!isEligible) {
    return (
      <div className="border border-gray-200 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Review Not Available</h3>
        <p className="text-gray-600 mb-4">
          You must purchase and download this product before leaving a review.
        </p>
        <div className="flex gap-3 justify-center">
          <Link href={`/products/${productId}`}>
            <Button variant="outline">
              <ShoppingCart className="w-4 h-4 mr-2" />
              View Product
            </Button>
          </Link>
          <Link href="/library">
            <Button>
              <Download className="w-4 h-4 mr-2" />
              Go to Library
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <>{children(isEligible, false)}</>
}
