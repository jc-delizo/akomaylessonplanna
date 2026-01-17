'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, TrendingUp, Eye, MousePointerClick, BarChart3 } from 'lucide-react'

interface SearchAnalytics {
  total_impressions: number
  total_clicks: number
  ctr: number
  average_ranking: number | null
}

interface SearchTerm {
  search_term: string
  impressions: number
  clicks: number
  ctr: number
  trend: number
}

export default function SearchAnalyticsPage() {
  const params = useParams()
  const productId = params.productId as string

  const [analytics, setAnalytics] = useState<SearchAnalytics | null>(null)
  const [searchTerms, setSearchTerms] = useState<SearchTerm[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true)
        
        // Fetch overview
        const overviewResponse = await fetch(`/api/seller/analytics/search/${productId}`)
        if (overviewResponse.ok) {
          const overviewData = await overviewResponse.json()
          setAnalytics(overviewData)
        }

        // Fetch search terms
        const termsResponse = await fetch(`/api/seller/analytics/search/terms/${productId}`)
        if (termsResponse.ok) {
          const termsData = await termsResponse.json()
          setSearchTerms(termsData.terms || [])
        }
      } catch (err) {
        console.error('Error fetching analytics:', err)
        setError('Failed to load analytics')
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchAnalytics()
    }
  }, [productId])

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/shop/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Search Analytics</h1>
      </div>

      {/* Overview Cards */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Total Impressions</span>
            </div>
            <p className="text-2xl font-bold">{analytics.total_impressions.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MousePointerClick className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Total Clicks</span>
            </div>
            <p className="text-2xl font-bold">{analytics.total_clicks.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">Last 30 days</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Click-Through Rate</span>
            </div>
            <p className="text-2xl font-bold">{analytics.ctr.toFixed(2)}%</p>
            <p className="text-xs text-gray-500 mt-1">CTR</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-purple-600" />
              <span className="text-sm font-medium text-gray-600">Avg. Ranking</span>
            </div>
            <p className="text-2xl font-bold">
              {analytics.average_ranking ? analytics.average_ranking.toFixed(1) : 'N/A'}
            </p>
            <p className="text-xs text-gray-500 mt-1">Position in results</p>
          </Card>
        </div>
      )}

      {/* Search Terms Report */}
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">Top Search Terms</h2>
        {searchTerms.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4 font-semibold">Search Term</th>
                  <th className="text-right py-2 px-4 font-semibold">Impressions</th>
                  <th className="text-right py-2 px-4 font-semibold">Clicks</th>
                  <th className="text-right py-2 px-4 font-semibold">CTR</th>
                  <th className="text-right py-2 px-4 font-semibold">Trend</th>
                </tr>
              </thead>
              <tbody>
                {searchTerms.map((term, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-4">{term.search_term}</td>
                    <td className="text-right py-2 px-4">{term.impressions.toLocaleString()}</td>
                    <td className="text-right py-2 px-4">{term.clicks.toLocaleString()}</td>
                    <td className="text-right py-2 px-4">{term.ctr.toFixed(2)}%</td>
                    <td className="text-right py-2 px-4">
                      <span className={`flex items-center justify-end gap-1 ${term.trend > 0 ? 'text-green-600' : term.trend < 0 ? 'text-red-600' : 'text-gray-600'}`}>
                        {term.trend > 0 && <TrendingUp className="w-4 h-4" />}
                        {term.trend !== 0 && `${term.trend > 0 ? '+' : ''}${term.trend.toFixed(1)}%`}
                        {term.trend === 0 && '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500">No search data available yet</p>
        )}
      </Card>
    </div>
  )
}
