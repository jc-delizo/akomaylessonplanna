'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/dashboard/pull-to-refresh'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GlareButton } from '@/components/ui/glare-button'
import {
  DollarSign,
  ShoppingBag,
  Eye,
  Star,
  TrendingUp,
  TrendingDown,
  Upload,
  FileText,
  Wallet,
  RefreshCw,
} from 'lucide-react'

interface DashboardMetrics {
  revenue: { value: number; trend: number; previousValue: number }
  sales: { value: number; trend: number }
  views: { value: number; trend: number; previousValue: number }
  rating: { value: number; count: number }
}

interface Activity {
  type: 'sale' | 'review' | 'follower'
  title: string
  message: string
  icon: string
  timestamp: string
  actionUrl?: string
}

interface ChartDataPoint {
  date: string
  revenue: number
}

export default function DashboardOverviewPage() {
  const router = useRouter()
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'all'>('month')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pioneer'>('free')

  useEffect(() => {
    loadDashboardData()
    loadUserTier()
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

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [overviewRes, activityRes] = await Promise.all([
        fetch(`/api/seller/dashboard/overview?time_period=${timePeriod}`),
        fetch('/api/seller/dashboard/activity-feed?limit=10'),
      ])

      if (!overviewRes.ok || !activityRes.ok) {
        throw new Error('Failed to load dashboard data')
      }

      const overviewData = await overviewRes.json()
      const activityData = await activityRes.json()

      setMetrics(overviewData.metrics)
      setChartData(overviewData.chartData || [])
      setActivities(activityData.activities || [])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetch('/api/seller/dashboard/refresh', { method: 'POST' })
      await loadDashboardData()
    } catch (error) {
      console.error('Error refreshing:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(amount)
  }

  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    return date.toLocaleDateString()
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Failed to load dashboard data.</p>
        <Button onClick={loadDashboardData} className="mt-4">
          Retry
        </Button>
      </div>
    )
  }

  const isProOrPioneer = subscriptionTier === 'pro' || subscriptionTier === 'pioneer'

  return (
    <PullToRefresh onRefresh={loadDashboardData}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-gray-600 mt-1">Welcome back! Here's your business at a glance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
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

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-600">
              <DollarSign className="h-5 w-5" />
              <span className="text-sm font-medium">Revenue</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {formatPrice(metrics.revenue.value)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Available for withdrawal</p>
          </div>
          <Sparkline trend={metrics.revenue.trend} />
        </Card>

        {/* Sales Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-600">
              <ShoppingBag className="h-5 w-5" />
              <span className="text-sm font-medium">Sales</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">{metrics.sales.value}</p>
            <p className="text-xs text-gray-500 mt-1">Total orders</p>
          </div>
          <Sparkline trend={metrics.sales.trend} />
        </Card>

        {/* Views Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Eye className="h-5 w-5" />
              <span className="text-sm font-medium">Product Views</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {metrics.views.value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500 mt-1">Total views</p>
          </div>
          <Sparkline trend={metrics.views.trend} />
        </Card>

        {/* Rating Card */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-gray-600">
              <Star className="h-5 w-5" />
              <span className="text-sm font-medium">Average Rating</span>
            </div>
          </div>
          <div className="mb-2">
            <p className="text-2xl font-bold text-gray-900">
              {metrics.rating.value > 0 ? metrics.rating.value.toFixed(1) : '0.0'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {metrics.rating.count} review{metrics.rating.count !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= Math.round(metrics.rating.value)
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Revenue Trend</h3>
          {isProOrPioneer ? (
            <div className="h-64 flex items-center justify-center text-gray-500">
              <p>Interactive chart (Pro/Pioneer feature)</p>
              <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
            </div>
          ) : (
            <div className="h-64">
              {/* Simple static chart for Free tier */}
              <div className="h-full flex items-end justify-between gap-1">
                {chartData.slice(-7).map((point, index) => {
                  const maxRevenue = Math.max(...chartData.map((p) => p.revenue), 1)
                  const height = (point.revenue / maxRevenue) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-purple-600 rounded-t transition-all"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                      />
                      <span className="text-xs text-gray-500 mt-2 transform -rotate-45 origin-top-left">
                        {new Date(point.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activities.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No recent activity</p>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <span className="text-2xl">{activity.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatRelativeTime(activity.timestamp)}
                    </p>
                  </div>
                  {activity.actionUrl && (
                    <Link href={activity.actionUrl}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlareButton>
            <Link href="/shop/products/new">
              <Button className="w-full justify-start" size="lg">
                <Upload className="h-5 w-5 mr-2" />
                Upload New Product
              </Button>
            </Link>
          </GlareButton>
          <Link href="/shop/orders">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <FileText className="h-5 w-5 mr-2" />
              View Orders
            </Button>
          </Link>
          <Link href="/shop/earnings">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Wallet className="h-5 w-5 mr-2" />
              Request Withdrawal
            </Button>
          </Link>
        </div>
      </Card>
      </div>
    </PullToRefresh>
  )
}
