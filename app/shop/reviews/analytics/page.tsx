'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AnalyticsData {
  distribution: {
    5: { count: number; percentage: number }
    4: { count: number; percentage: number }
    3: { count: number; percentage: number }
    2: { count: number; percentage: number }
    1: { count: number; percentage: number }
  }
  keywords: Array<{ word: string; count: number }>
  trends: Array<{ month: string; average: number; count: number }>
  totalReviews: number
}

export default function ReviewAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/seller/reviews/analytics')
      const data = await response.json()

      if (!response.ok) {
        if (response.status === 403) {
          setError('Enhanced analytics are only available for Pro and Pioneer sellers')
        } else {
          throw new Error(data.error || 'Failed to load analytics')
        }
        return
      }

      setAnalytics(data)
    } catch (err) {
      console.error('Error loading analytics:', err)
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-600">Loading analytics...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/shop/upgrade">
              <Button className="bg-[#ff7200] hover:bg-[#e66800]">Unlock with Pro</Button>
            </Link>
            <Link href="/shop/reviews">
              <Button variant="outline">Back to Reviews</Button>
            </Link>
          </div>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  const renderStars = (count: number) => {
    return '★'.repeat(count) + '☆'.repeat(5 - count)
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-6">
        <Link href="/shop/reviews">
          <Button variant="ghost" className="mb-4">
            ← Back to Reviews
          </Button>
        </Link>
        <h1 className="text-2xl font-bold mb-2">Review Analytics</h1>
        <p className="text-gray-600">
          Detailed insights into your product reviews (Pro/Pioneer only)
        </p>
      </div>

      {/* Rating Distribution */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Rating Distribution</h2>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const data = analytics.distribution[rating as keyof typeof analytics.distribution]
            const percentage = data.percentage
            const barWidth = Math.max(percentage, 2)

            return (
              <div key={rating} className="flex items-center gap-3">
                <div className="w-24 text-left">
                  <span className="text-yellow-500">{renderStars(rating)}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-yellow-400 h-4 rounded-full"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className="text-gray-600 w-32 text-right text-sm">
                      {data.count} ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </Card>

      {/* Keywords */}
      {analytics.keywords.length > 0 && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Most Common Keywords</h2>
          <div className="space-y-2">
            {analytics.keywords.map((keyword, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="font-medium">"{keyword.word}"</span>
                <span className="text-gray-600">mentioned {keyword.count} times</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Trends */}
      {analytics.trends.length > 0 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Review Trends (Last 12 Months)</h2>
          <div className="space-y-3">
            {analytics.trends.map((trend, index) => (
              <div key={index} className="flex items-center justify-between border-b pb-2">
                <span className="font-medium">
                  {new Date(trend.month + '-01').toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    {trend.count} {trend.count === 1 ? 'review' : 'reviews'}
                  </span>
                  <span className="font-semibold">
                    {trend.average.toFixed(1)} ★
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
