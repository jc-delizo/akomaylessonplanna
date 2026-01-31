'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { PullToRefresh } from '@/components/dashboard/pull-to-refresh'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GlareButton } from '@/components/ui/glare-button'
import { ProTierPlaceholder } from '@/components/pro-tier-placeholder'
import {
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
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
  Info,
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
          <Link href="/shop/orders">
            <Button variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              View Orders
            </Button>
          </Link>
          <Link href="/shop/earnings">
            <Button variant="outline" size="sm">
              <Wallet className="h-4 w-4 mr-2" />
              Request Withdrawal
            </Button>
          </Link>
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
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Net earnings from completed orders in the selected period. Available for withdrawal after processing.</p>
              </TooltipContent>
            </UITooltip>
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
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Number of completed orders in the selected period.</p>
              </TooltipContent>
            </UITooltip>
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
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Total product page loads (including your own). Trend compares this period to the previous period.</p>
              </TooltipContent>
            </UITooltip>
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
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Average star rating across all reviews on your products.</p>
              </TooltipContent>
            </UITooltip>
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
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="rgb(147 51 234)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="rgb(147 51 234)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    className="text-xs"
                  />
                  <YAxis
                    tickFormatter={(v) => `₱${v}`}
                    className="text-xs"
                    width={50}
                  />
                  <Tooltip
                    formatter={(value: number | undefined) => [value != null ? `₱${value.toFixed(2)}` : '', 'Revenue']}
                    labelFormatter={(label) => (label != null ? new Date(label).toLocaleDateString('en-US') : '')}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="rgb(147 51 234)"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <ProTierPlaceholder
              title="Pro Feature"
              description="Interactive charts and 30-day revenue trends. Unlock with Pro to see full analytics."
              ctaLabel="Unlock with Pro"
            />
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
      </div>
    </PullToRefresh>
  )
}
