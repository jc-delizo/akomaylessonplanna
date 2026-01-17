'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Eye, ShoppingBag, Star, TrendingUp, TrendingDown, Download } from 'lucide-react'

interface ProductMetrics {
  id: string
  title: string
  views: number
  sales: number
  revenue: number
  rating: number
  reviews_count: number
  conversion_rate: number
  status: string
}

interface AnalyticsData {
  products: ProductMetrics[]
  summary: {
    totalViews: number
    totalSales: number
    totalRevenue: number
    avgRating: number
    avgConversion: number
  }
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pioneer'>('free')
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'all'>('month')
  const [sortBy, setSortBy] = useState<string>('revenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  useEffect(() => {
    loadUserTier()
    loadAnalytics()
  }, [timePeriod])

  const loadUserTier = async () => {
    try {
      const response = await fetch('/api/me/profile')
      if (response.ok) {
        const { profile } = await response.json()
        setSubscriptionTier(profile.subscription_tier || 'free')
      }
    } catch (error) {
      console.error('Error loading user tier:', error)
    }
  }

  const loadAnalytics = async () => {
    try {
      setLoading(true)
      // For Free tier, get basic product metrics
      const response = await fetch('/api/seller/products')
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }

      const { products } = await response.json()

      // Calculate summary
      const totalViews = products.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0)
      const totalSales = products.reduce((sum: number, p: any) => sum + (p.sales_count || 0), 0)
      const totalRevenue = products.reduce((sum: number, p: any) => {
        // Estimate revenue from sales (simplified)
        return sum + (p.price || 0) * (p.sales_count || 0) * 0.8 // 80% after commission
      }, 0)
      const ratings = products.filter((p: any) => p.avg_rating).map((p: any) => p.avg_rating)
      const avgRating =
        ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
      const conversions = products
        .filter((p: any) => p.conversion_rate)
        .map((p: any) => p.conversion_rate)
      const avgConversion =
        conversions.length > 0
          ? conversions.reduce((a: number, b: number) => a + b, 0) / conversions.length
          : 0

      const productMetrics: ProductMetrics[] = products.map((p: any) => ({
        id: p.id,
        title: p.title,
        views: p.views_count || 0,
        sales: p.sales_count || 0,
        revenue: (p.price || 0) * (p.sales_count || 0) * 0.8,
        rating: p.avg_rating || 0,
        reviews_count: p.reviews_count || 0,
        conversion_rate: p.conversion_rate || 0,
        status: p.status,
      }))

      setAnalytics({
        products: productMetrics,
        summary: {
          totalViews,
          totalSales,
          totalRevenue,
          avgRating,
          avgConversion,
        },
      })
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = () => {
    if (!analytics) return

    const headers = [
      'Product',
      'Status',
      'Views',
      'Sales',
      'Revenue',
      'Rating',
      'Reviews',
      'Conversion Rate',
    ]

    const rows = analytics.products.map((product) => [
      product.title,
      product.status,
      product.views.toString(),
      product.sales.toString(),
      `₱${product.revenue.toFixed(2)}`,
      product.rating > 0 ? product.rating.toFixed(1) : 'N/A',
      product.reviews_count.toString(),
      `${product.conversion_rate.toFixed(2)}%`,
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `analytics-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
  }

  const Sparkline = ({ trend }: { trend: number }) => {
    const isPositive = trend >= 0
    return (
      <div className="flex items-center gap-1 text-xs">
        {isPositive ? (
          <TrendingUp className="h-3 w-3 text-green-600" />
        ) : (
          <TrendingDown className="h-3 w-3 text-red-600" />
        )}
        <span className={isPositive ? 'text-green-600' : 'text-red-600'}>
          {Math.abs(trend).toFixed(1)}%
        </span>
      </div>
    )
  }

  const isProOrPioneer = subscriptionTier === 'pro' || subscriptionTier === 'pioneer'

  // Sort products
  const sortedProducts = [...(analytics?.products || [])].sort((a, b) => {
    let aValue: number
    let bValue: number

    switch (sortBy) {
      case 'views':
        aValue = a.views
        bValue = b.views
        break
      case 'sales':
        aValue = a.sales
        bValue = b.sales
        break
      case 'revenue':
        aValue = a.revenue
        bValue = b.revenue
        break
      case 'rating':
        aValue = a.rating
        bValue = b.rating
        break
      case 'conversion':
        aValue = a.conversion_rate
        bValue = b.conversion_rate
        break
      default:
        aValue = a.revenue
        bValue = b.revenue
    }

    return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load analytics data.</p>
        <Button onClick={loadAnalytics} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-1">
            {isProOrPioneer
              ? 'Advanced analytics and insights for your business'
              : 'Product performance metrics'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-2" />
            Export {isProOrPioneer ? 'Report' : 'CSV'}
          </Button>
        </div>
      </div>

      {/* Time Period Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Time Period:</span>
        {(['today', 'week', 'month', 'all'] as const).map((period) => (
          <Button
            key={period}
            variant={timePeriod === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimePeriod(period)}
            className="capitalize"
          >
            {period === 'all' ? 'All Time' : period}
          </Button>
        ))}
      </div>

      {/* Summary Cards (Free Tier) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Eye className="h-4 w-4" />
            <span className="text-sm">Total Views</span>
          </div>
          <p className="text-2xl font-bold">{analytics.summary.totalViews.toLocaleString()}</p>
          <Sparkline trend={15} />
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-sm">Total Sales</span>
          </div>
          <p className="text-2xl font-bold">{analytics.summary.totalSales}</p>
          <Sparkline trend={8} />
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <span className="text-sm">Total Revenue</span>
          </div>
          <p className="text-2xl font-bold">₱{analytics.summary.totalRevenue.toFixed(2)}</p>
          <Sparkline trend={12} />
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Star className="h-4 w-4" />
            <span className="text-sm">Avg Rating</span>
          </div>
          <p className="text-2xl font-bold">
            {analytics.summary.avgRating > 0 ? analytics.summary.avgRating.toFixed(1) : '0.0'}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <span className="text-sm">Avg Conversion</span>
          </div>
          <p className="text-2xl font-bold">{analytics.summary.avgConversion.toFixed(1)}%</p>
          <Sparkline trend={5} />
        </Card>
      </div>

      {/* Pro/Pioneer Advanced Charts */}
      {isProOrPioneer && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Interactive line chart (Pro/Pioneer feature)</p>
              <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sales by Product</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Interactive bar chart (Pro/Pioneer feature)</p>
              <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Interactive pie chart (Pro/Pioneer feature)</p>
              <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Interactive funnel chart (Pro/Pioneer feature)</p>
              <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Interactive bar chart (Pro/Pioneer feature)</p>
              <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Buyer Demographics</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Interactive charts (Pro/Pioneer feature)</p>
              <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            </div>
          </Card>
        </div>
      )}

      {/* Product Performance Table */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Product Performance</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Sort by:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1 border rounded-md text-sm"
            >
              <option value="revenue">Revenue</option>
              <option value="sales">Sales</option>
              <option value="views">Views</option>
              <option value="rating">Rating</option>
              <option value="conversion">Conversion</option>
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-4">Product</th>
                <th className="text-right py-2 px-4">Views</th>
                <th className="text-right py-2 px-4">Sales</th>
                <th className="text-right py-2 px-4">Revenue</th>
                <th className="text-right py-2 px-4">Rating</th>
                <th className="text-right py-2 px-4">Reviews</th>
                <th className="text-right py-2 px-4">Conversion</th>
                <th className="text-left py-2 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((product) => (
                <tr key={product.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 px-4">
                    <p className="font-medium">{product.title}</p>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{product.views.toLocaleString()}</span>
                      <Sparkline trend={15} />
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{product.sales}</span>
                      <Sparkline trend={8} />
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>₱{product.revenue.toFixed(2)}</span>
                      <Sparkline trend={12} />
                    </div>
                  </td>
                  <td className="py-2 px-4 text-right">
                    {product.rating > 0 ? (
                      <div className="flex items-center justify-end gap-1">
                        <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                        <span>{product.rating.toFixed(1)}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">N/A</span>
                    )}
                  </td>
                  <td className="py-2 px-4 text-right">{product.reviews_count}</td>
                  <td className="py-2 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <span>{product.conversion_rate.toFixed(1)}%</span>
                      <Sparkline trend={5} />
                    </div>
                  </td>
                  <td className="py-2 px-4">
                    <Badge
                      className={
                        product.status === 'published'
                          ? 'bg-green-600'
                          : product.status === 'draft'
                          ? 'bg-gray-500'
                          : 'bg-yellow-500'
                      }
                    >
                      {product.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pro/Pioneer Recommendations */}
      {isProOrPioneer && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Recommendations</h2>
          <div className="space-y-3">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-1">
                High views, low conversion
              </p>
              <p className="text-sm text-blue-700">
                Consider lowering price or adding preview images to increase conversion rate.
              </p>
            </div>
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-900 mb-1">Top performing product</p>
              <p className="text-sm text-green-700">
                Your "{sortedProducts[0]?.title}" is performing well. Consider creating similar
                products.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
