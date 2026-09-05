'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/default/select/select'
import {
  Tooltip as UITooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip'
import { Eye, ShoppingBag, Star, TrendingUp, TrendingDown, Download, Info } from 'lucide-react'
import { ProTierPlaceholder } from '@/components/pro-tier-placeholder'

const PIE_COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#8b5cf6', '#6d28d9']

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

interface Recommendation {
  type: string
  priority: string
  title: string
  message: string
  actionUrl?: string
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pioneer'>('free')
  const [timePeriod, setTimePeriod] = useState<'today' | 'week' | 'month' | 'all'>('month')
  const [sortBy, setSortBy] = useState<string>('revenue')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [revenueData, setRevenueData] = useState<Array<{ period: string; revenue: number }>>([])
  const [topProducts, setTopProducts] = useState<Array<{ id: string; title: string; revenue: number }>>([])
  const [categorySales, setCategorySales] = useState<Array<{ category: string; revenue: number }>>([])
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv')
  const [exporting, setExporting] = useState(false)
  const [overviewTrends, setOverviewTrends] = useState<{
    revenue: number
    sales: number
    views: number
  }>({ revenue: 0, sales: 0, views: 0 })
  const [demographics, setDemographics] = useState<{
    gradeLevels: Array<{ grade: string; count: number; percentage: number }>
    regions: Array<{ region: string; count: number; percentage: number }>
    repeatCustomerRate: number
    totalBuyers: number
    repeatBuyers: number
  } | null>(null)
  const [funnelStages, setFunnelStages] = useState<Array<{ name: string; value: number }> | null>(null)
  const [trafficSources, setTrafficSources] = useState<Array<{ source: string; count: number; percentage?: number }> | null>(null)

  useEffect(() => {
    loadUserTier()
    loadAnalytics()
  }, [timePeriod])

  useEffect(() => {
    if (subscriptionTier === 'pro' || subscriptionTier === 'pioneer') {
      fetch('/api/seller/analytics/recommendations')
        .then((res) => res.ok ? res.json() : { recommendations: [] })
        .then((data) => setRecommendations(data.recommendations || []))
        .catch(() => setRecommendations([]))
    }
  }, [subscriptionTier])

  useEffect(() => {
    if (subscriptionTier !== 'pro' && subscriptionTier !== 'pioneer') return
    const days = timePeriod === 'today' ? 1 : timePeriod === 'week' ? 7 : timePeriod === 'month' ? 30 : 90
    fetch(`/api/seller/analytics/revenue?time_period=${days}&group_by=day`)
      .then((res) => res.ok ? res.json() : { dataPoints: [] })
      .then((data) => setRevenueData(data.dataPoints || []))
      .catch(() => setRevenueData([]))
    fetch('/api/seller/analytics/products')
      .then((res) => res.ok ? res.json() : { topProducts: [], categorySales: [] })
      .then((data) => {
        setTopProducts(data.topProducts || [])
        setCategorySales(data.categorySales || [])
      })
      .catch(() => {
        setTopProducts([])
        setCategorySales([])
      })
    fetch('/api/seller/analytics/demographics')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setDemographics(data || null))
      .catch(() => setDemographics(null))
    fetch('/api/seller/analytics/funnel')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setFunnelStages(data?.stages ?? null))
      .catch(() => setFunnelStages(null))
    fetch('/api/seller/analytics/traffic')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => setTrafficSources(data?.trafficSources ?? null))
      .catch(() => setTrafficSources(null))
  }, [subscriptionTier, timePeriod])

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
      const [response, overviewRes] = await Promise.all([
        fetch('/api/seller/products'),
        fetch(`/api/seller/dashboard/overview?time_period=${timePeriod}`),
      ])
      if (!response.ok) {
        throw new Error('Failed to load analytics')
      }

      const { products } = await response.json()

      if (overviewRes.ok) {
        const overviewData = await overviewRes.json()
        const m = overviewData.metrics
        setOverviewTrends({
          revenue: m?.revenue?.trend ?? 0,
          sales: m?.sales?.trend ?? 0,
          views: m?.views?.trend ?? 0,
        })
      } else {
        setOverviewTrends({ revenue: 0, sales: 0, views: 0 })
      }

      // Use real revenue from API (per-product net_earnings sum from order_items)
      const totalViews = products.reduce((sum: number, p: any) => sum + (p.views_count || 0), 0)
      const totalSales = products.reduce((sum: number, p: any) => sum + (p.sales_count || 0), 0)
      const totalRevenue = products.reduce((sum: number, p: any) => sum + (p.revenue ?? 0), 0)
      const ratings = products.filter((p: any) => p.avg_rating).map((p: any) => p.avg_rating)
      const avgRating =
        ratings.length > 0 ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length : 0
      const conversions = products.map((p: any) => p.conversion_rate ?? 0)
      const avgConversion =
        conversions.length > 0
          ? conversions.reduce((a: number, b: number) => a + b, 0) / conversions.length
          : 0

      const productMetrics: ProductMetrics[] = products.map((p: any) => ({
        id: p.id,
        title: p.title,
        views: p.views_count || 0,
        sales: p.sales_count || 0,
        revenue: p.revenue ?? 0,
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

  const handleExport = async () => {
    if (exportFormat === 'csv') {
      handleExportCSV()
      return
    }
    setExporting(true)
    try {
      const res = await fetch('/api/seller/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          export_type: 'analytics_report',
          format: exportFormat,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Export failed')
        setExporting(false)
        return
      }
      const { job_id } = await res.json()
      let attempts = 0
      const poll = async () => {
        const j = await fetch(`/api/seller/export/${job_id}`).then((r) => r.json())
        if (j.status === 'completed' && j.file_url) {
          window.open(j.file_url, '_blank')
          setExporting(false)
          return
        }
        if (j.status === 'failed') {
          alert(j.error_message || 'Export failed')
          setExporting(false)
          return
        }
        if (++attempts < 30) setTimeout(poll, 1500)
        else setExporting(false)
      }
      setTimeout(poll, 1000)
    } catch (e) {
      setExporting(false)
      alert('Export failed')
    }
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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-1">
            {isProOrPioneer
              ? 'Advanced analytics and insights for your business'
              : 'Product performance metrics'}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {!isProOrPioneer && (
            <Link href="/shop/upgrade">
              <Button className="bg-[#ff7200] hover:bg-[#e66800]">Upgrade to Pro</Button>
            </Link>
          )}
          <Select
            value={exportFormat}
            onValueChange={(v) => setExportFormat(v as 'csv' | 'xlsx' | 'pdf')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="xlsx" disabled={!isProOrPioneer}>
                Excel{!isProOrPioneer ? ' (Pro only)' : ''}
              </SelectItem>
              <SelectItem value="pdf" disabled={!isProOrPioneer}>
                PDF{!isProOrPioneer ? ' (Pro only)' : ''}
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleExport}
            disabled={!analytics?.products?.length || exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting…' : `Export ${exportFormat.toUpperCase()}`}
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
          <div className="flex items-center justify-between gap-2 text-gray-600 mb-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="text-sm">Total Views</span>
            </div>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Sum of page loads for your products (each product detail view counts, including your own).</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-2xl font-bold">{analytics.summary.totalViews.toLocaleString()}</p>
          <Sparkline trend={overviewTrends.views} />
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 text-gray-600 mb-2">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="text-sm">Total Sales</span>
            </div>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Sum of completed order item count across your products.</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-2xl font-bold">{analytics.summary.totalSales}</p>
          <Sparkline trend={overviewTrends.sales} />
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 text-gray-600 mb-2">
            <span className="text-sm">Total Revenue</span>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Sum of your net earnings from completed orders (after platform commission).</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-2xl font-bold">₱{analytics.summary.totalRevenue.toFixed(2)}</p>
          <Sparkline trend={overviewTrends.revenue} />
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 text-gray-600 mb-2">
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span className="text-sm">Avg Rating</span>
            </div>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Average of your products&apos; star ratings (from reviews).</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-2xl font-bold">
            {analytics.summary.avgRating > 0 ? analytics.summary.avgRating.toFixed(1) : '0.0'}
          </p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between gap-2 text-gray-600 mb-2">
            <span className="text-sm">Avg Conversion</span>
            <UITooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help flex-shrink-0" />
              </TooltipTrigger>
              <TooltipContent>
                <p>Average of (sales ÷ views × 100) per product. Shows how often views turn into purchases.</p>
              </TooltipContent>
            </UITooltip>
          </div>
          <p className="text-2xl font-bold">{analytics.summary.avgConversion.toFixed(1)}%</p>
        </Card>
      </div>

      {/* Pro/Pioneer Advanced Charts or Free placeholder */}
      {isProOrPioneer ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue Over Time</h3>
            <div className="h-64">
              {revenueData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No revenue data for this period</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="analyticsRevenueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="period" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `₱${v}`} tick={{ fontSize: 11 }} width={50} />
                    <Tooltip formatter={(value) => [`₱${Number(value ?? 0).toFixed(2)}`, 'Revenue']} labelFormatter={(label) => new Date(String(label)).toLocaleDateString('en-US')} />
                    <Area type="monotone" dataKey="revenue" stroke="#7c3aed" strokeWidth={2} fill="url(#analyticsRevenueGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sales by Product</h3>
            <div className="h-64">
              {topProducts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No product data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts.slice(0, 8)} layout="vertical" margin={{ top: 8, right: 8, left: 80, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tickFormatter={(v) => `₱${v}`} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="title" width={75} tick={{ fontSize: 10 }} tickFormatter={(v) => v.length > 20 ? v.slice(0, 20) + '…' : v} />
                    <Tooltip formatter={(value) => [`₱${Number(value ?? 0).toFixed(2)}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sales by Category</h3>
            <div className="h-64">
              {categorySales.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No category data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorySales.map((item) => ({ name: item.category.replace('_', ' '), value: item.revenue }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {categorySales.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`₱${Number(value ?? 0).toFixed(2)}`, 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Conversion Funnel</h3>
            <div className="h-64">
              {!funnelStages || funnelStages.every((s) => s.value === 0) ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No funnel data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelStages} layout="vertical" margin={{ top: 8, right: 24, left: 100, bottom: 8 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={95} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Count']} />
                    <Bar dataKey="value" fill="#7c3aed" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Traffic Sources</h3>
            <div className="h-64">
              {!trafficSources || trafficSources.length === 0 ? (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No traffic data yet</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={trafficSources.map((item) => ({ name: item.source, value: item.count }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {trafficSources.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [Number(value ?? 0).toLocaleString(), 'Views']} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Buyer Demographics</h3>
            <div className="space-y-4">
              {(!demographics || (demographics.gradeLevels.length === 0 && demographics.regions.length === 0)) ? (
                <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No demographic data yet</div>
              ) : (
                <>
                  {demographics.gradeLevels.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Grade levels</p>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={demographics.gradeLevels} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="grade" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 11 }} width={30} />
                            <Tooltip formatter={(value) => [Number(value ?? 0), 'Orders']} />
                            <Bar dataKey="count" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {demographics.regions.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Regions</p>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={demographics.regions.map((r) => ({ name: r.region, value: r.count }))}
                              cx="50%"
                              cy="50%"
                              innerRadius={35}
                              outerRadius={60}
                              paddingAngle={2}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                            >
                              {demographics.regions.map((_, index) => (
                                <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [Number(value ?? 0), 'Orders']} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                  {(demographics.totalBuyers > 0 || demographics.repeatCustomerRate > 0) && (
                    <p className="text-sm text-muted-foreground">
                      Repeat customer rate: <span className="font-medium text-foreground">{demographics.repeatCustomerRate.toFixed(1)}%</span>
                      {demographics.totalBuyers > 0 && (
                        <> ({demographics.repeatBuyers} of {demographics.totalBuyers} buyers)</>
                      )}
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <ProTierPlaceholder
          title="Pro Feature"
          description="Revenue over time, top products, sales by category, traffic sources, and buyer demographics. Unlock with Pro."
          ctaLabel="Unlock with Pro"
        />
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

      {/* Pro/Pioneer Recommendations or Free placeholder */}
      {isProOrPioneer ? (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Performance Recommendations</h2>
          <div className="space-y-3">
            {recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recommendations right now. Keep selling to get personalized tips.</p>
            ) : (
              recommendations.map((rec, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-lg border ${
                    rec.priority === 'high' ? 'bg-blue-50 border-blue-200' :
                    rec.priority === 'medium' ? 'bg-amber-50 border-amber-200' :
                    'bg-green-50 border-green-200'
                  }`}
                >
                  <p className="text-sm font-medium text-foreground mb-1">{rec.title}</p>
                  <p className="text-sm text-muted-foreground">{rec.message}</p>
                  {rec.actionUrl && (
                    <Link href={rec.actionUrl} className="inline-block mt-2">
                      <Button variant="link" size="sm" className="p-0 h-auto">View</Button>
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      ) : (
        <ProTierPlaceholder
          title="Pro only"
          description="Personalized performance recommendations to grow your sales. Unlock with Pro."
          ctaLabel="Unlock with Pro"
        />
      )}
    </div>
  )
}
