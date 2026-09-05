'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/default/select/select'
import {
  Wallet,
  Clock,
  TrendingUp,
  Calendar,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  XCircle,
  CreditCard,
  Info,
  DollarSign,
  Circle,
  Download,
} from 'lucide-react'
import { ProTierPlaceholder } from '@/components/pro-tier-placeholder'

const PIE_COLORS = ['#7c3aed', '#a78bfa', '#c4b5fd', '#8b5cf6', '#6d28d9']

interface EarningsData {
  available_balance: number
  pending_balance: number
  total_earnings: number
  this_week: number
  this_month: number
  all_time: number
  charts?: {
    revenueByMonth: Array<{ month: string; revenue: number }>
    salesByCategory: Array<{ category: string; revenue: number }>
    earningsTrend: Array<{ date: string; earnings: number }>
  }
  projected?: {
    amount: number
    growth: number
    lastMonth: number
  }
}

interface Withdrawal {
  id: string
  amount: number
  payment_method: string
  status: string
  created_at: string
  processed_at?: string
  transaction_reference?: string
}

export default function SellerEarningsPage() {
  const router = useRouter()
  const [earnings, setEarnings] = useState<EarningsData | null>(null)
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([])
  const [loading, setLoading] = useState(true)
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'maya'>('gcash')
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false)
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pioneer'>('free')
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv')
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadEarnings()
    loadWithdrawals()
    loadUserTier()
  }, [])

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

  const loadEarnings = async () => {
    try {
      const response = await fetch('/api/seller/earnings')
      if (!response.ok) {
        throw new Error('Failed to load earnings')
      }

      const data = await response.json()
      setEarnings(data)
    } catch (error) {
      console.error('Error loading earnings:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadWithdrawals = async () => {
    try {
      const response = await fetch('/api/seller/withdrawals')
      if (response.ok) {
        const data = await response.json()
        setWithdrawals(data.withdrawals || [])
      }
    } catch (error) {
      console.error('Error loading withdrawals:', error)
    }
  }

  const handleWithdrawal = async () => {
    const amount = parseFloat(withdrawalAmount)
    if (isNaN(amount) || amount < 500) {
      alert('Minimum withdrawal amount is ₱500')
      return
    }

    if (amount > (earnings?.available_balance || 0)) {
      alert('Insufficient balance')
      return
    }

    setWithdrawing(true)
    try {
      const response = await fetch('/api/seller/withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amount,
          payment_method: paymentMethod,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to process withdrawal')
      }

      alert('Withdrawal request submitted successfully!')
      setShowWithdrawalForm(false)
      setWithdrawalAmount('')
      loadEarnings()
      loadWithdrawals()
    } catch (error: any) {
      console.error('Error processing withdrawal:', error)
      alert(error.message || 'Failed to process withdrawal. Please try again.')
    } finally {
      setWithdrawing(false)
    }
  }

  const isProOrPioneer = subscriptionTier === 'pro' || subscriptionTier === 'pioneer'

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await fetch('/api/seller/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          export_type: 'earnings',
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-6xl">
        <Skeleton className="h-9 w-48 mb-6" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </Card>
          <Card className="p-6">
            <Skeleton className="h-4 w-40 mb-4" />
            <Skeleton className="h-10 w-32 mb-2" />
            <Skeleton className="h-3 w-48" />
          </Card>
        </div>
        <Card className="p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <Skeleton className="h-32 w-full" />
        </Card>
      </div>
    )
  }

  if (!earnings) {
    return (
      <Card className="p-12 text-center">
        <p className="text-gray-600">Failed to load earnings data.</p>
      </Card>
    )
  }

  const canWithdraw = earnings.available_balance >= 500

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Earnings</h1>
          <p className="text-gray-600 mt-1">Track your earnings and manage withdrawals</p>
        </div>
        <div className="flex gap-2 items-center">
          <Select
            value={exportFormat}
            onValueChange={(v) => setExportFormat(v as 'csv' | 'xlsx' | 'pdf')}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="csv">CSV</SelectItem>
              {isProOrPioneer && (
                <>
                  <SelectItem value="xlsx">Excel</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-2" />
            {exporting ? 'Exporting…' : `Export ${exportFormat.toUpperCase()}`}
          </Button>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="relative overflow-hidden border-green-200/50 bg-gradient-to-br from-green-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Wallet className="h-4 w-4 text-green-600" />
                Available for Withdrawal
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Funds ready to withdraw. Minimum withdrawal is ₱500.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600 mb-2">
              ₱{earnings.available_balance.toFixed(2)}
            </p>
            <CardDescription className="text-xs">
              Minimum withdrawal: ₱500
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-yellow-200/50 bg-gradient-to-br from-yellow-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending Balance
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Funds are being processed. Available after 3-day hold period.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600 mb-2">
              ₱{earnings.pending_balance.toFixed(2)}
            </p>
            <CardDescription className="text-xs">
              Processing (3-day hold period)
            </CardDescription>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-purple-200/50 bg-gradient-to-br from-purple-50/50 to-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                Total Lifetime Earnings
              </CardTitle>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-gray-400 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Your total earnings from all completed sales.</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600 mb-2">
              ₱{earnings.total_earnings.toFixed(2)}
            </p>
            <CardDescription className="text-xs">
              All-time total
            </CardDescription>
          </CardContent>
        </Card>
      </div>

      {/* Withdrawal Section */}
      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-gray-600" />
                Request Withdrawal
              </CardTitle>
              <CardDescription className="mt-1">
                Withdraw your available earnings to your preferred payment method
              </CardDescription>
            </div>
            {!showWithdrawalForm && (
              <Button
                onClick={() => setShowWithdrawalForm(true)}
                disabled={!canWithdraw}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4" />
                Request Withdrawal
              </Button>
            )}
          </div>
        </CardHeader>

        {showWithdrawalForm && (
          <CardContent>
            <Separator className="mb-6" />
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-medium">
                  Withdrawal Amount
                </Label>
                <Input
                  id="amount"
                  type="number"
                  min="500"
                  max={earnings.available_balance}
                  step="0.01"
                  value={withdrawalAmount}
                  onChange={(e) => setWithdrawalAmount(e.target.value)}
                  placeholder={`₱${earnings.available_balance.toFixed(2)}`}
                  className="text-lg"
                />
                <CardDescription className="text-xs">
                  Available: ₱{earnings.available_balance.toFixed(2)} • Minimum: ₱500
                </CardDescription>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Withdraw to</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setPaymentMethod('gcash')}
                    className={`relative p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                      paymentMethod === 'gcash'
                        ? 'border-blue-600 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'gcash'
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'gcash' && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">GCash</span>
                        <p className="text-xs text-gray-500 mt-0.5">Mobile wallet</p>
                      </div>
                      {paymentMethod === 'gcash' && (
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => setPaymentMethod('maya')}
                    className={`relative p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
                      paymentMethod === 'maya'
                        ? 'border-orange-600 bg-orange-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                          paymentMethod === 'maya'
                            ? 'border-orange-600 bg-orange-600'
                            : 'border-gray-300 bg-white'
                        }`}
                      >
                        {paymentMethod === 'maya' && (
                          <CheckCircle2 className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="flex-1">
                        <span className="font-semibold text-gray-900">Maya</span>
                        <p className="text-xs text-gray-500 mt-0.5">Mobile wallet</p>
                      </div>
                      {paymentMethod === 'maya' && (
                        <CheckCircle2 className="h-5 w-5 text-orange-600" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              <Separator />

              <div className="flex gap-4">
                <Button
                  className="flex-1 flex items-center justify-center gap-2"
                  onClick={handleWithdrawal}
                  disabled={withdrawing || !withdrawalAmount || parseFloat(withdrawalAmount) < 500}
                >
                  {withdrawing ? (
                    <>
                      <Circle className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4" />
                      Request Withdrawal
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowWithdrawalForm(false)
                    setWithdrawalAmount('')
                  }}
                  disabled={withdrawing}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Earnings Breakdown */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-gray-600" />
            Earnings Breakdown
          </CardTitle>
          <CardDescription>View your earnings across different time periods</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="p-5 bg-gradient-to-br from-blue-50/50 to-white border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardDescription className="text-xs font-medium text-gray-600 mb-0">
                    This Week
                  </CardDescription>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₱{earnings.this_week.toFixed(2)}
              </p>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-green-50/50 to-white border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <CardDescription className="text-xs font-medium text-gray-600 mb-0">
                    This Month
                  </CardDescription>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₱{earnings.this_month.toFixed(2)}
              </p>
            </Card>

            <Card className="p-5 bg-gradient-to-br from-purple-50/50 to-white border-purple-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <CardDescription className="text-xs font-medium text-gray-600 mb-0">
                    All Time
                  </CardDescription>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ₱{earnings.all_time.toFixed(2)}
              </p>
            </Card>
          </div>

          {/* Projected Earnings: Pro/Pioneer real data, Free placeholder */}
          <Separator className="my-6" />
          {earnings.projected && (subscriptionTier === 'pro' || subscriptionTier === 'pioneer') ? (
            <Card className="p-5 bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-purple-700" />
                    <CardDescription className="text-sm font-medium text-gray-700 mb-0">
                      Projected Earnings This Month
                    </CardDescription>
                  </div>
                  <p className="text-2xl font-bold text-purple-700 mb-1">
                    ₱{earnings.projected.amount.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600">
                    <span className={earnings.projected.growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {earnings.projected.growth >= 0 ? '+' : ''}
                      {earnings.projected.growth.toFixed(1)}%
                    </span>
                    {' '}vs last month
                  </p>
                </div>
              </div>
            </Card>
          ) : !(subscriptionTier === 'pro' || subscriptionTier === 'pioneer') ? (
            <ProTierPlaceholder
              title="Pro only"
              description="Projected earnings this month based on your current pace. Unlock with Pro."
              ctaLabel="Unlock with Pro"
            />
          ) : null}
        </CardContent>
      </Card>

      {/* Charts: Pro/Pioneer real charts, Free placeholder */}
      {(subscriptionTier === 'pro' || subscriptionTier === 'pioneer') && earnings.charts ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Month */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                Revenue by Month
              </CardTitle>
              <CardDescription>Monthly revenue breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={earnings.charts.revenueByMonth} margin={{ top: 8, right: 8, left: 0, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `₱${v}`} tick={{ fontSize: 11 }} width={50} />
                    <RechartsTooltip formatter={(value) => [value != null ? `₱${Number(value).toFixed(2)}` : '', 'Revenue']} />
                    <Bar dataKey="revenue" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Sales by Category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-gray-600" />
                Sales by Product Category
              </CardTitle>
              <CardDescription>Revenue distribution by category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={earnings.charts.salesByCategory.map((item) => ({
                        name: item.category.replace('_', ' '),
                        value: item.revenue,
                      }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                    >
                      {earnings.charts.salesByCategory.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [value != null ? `₱${Number(value).toFixed(2)}` : '', 'Revenue']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Earnings Trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gray-600" />
                Earnings Trend (Last 30 Days)
              </CardTitle>
              <CardDescription>Daily earnings over the past month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={earnings.charts.earningsTrend.slice(-30)} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => `₱${v}`} tick={{ fontSize: 11 }} width={50} />
                    <RechartsTooltip formatter={(value) => [value != null ? `₱${Number(value).toFixed(2)}` : '', 'Earnings']} labelFormatter={(label) => (label != null ? new Date(String(label)).toLocaleDateString('en-US') : '')} />
                    <Area type="monotone" dataKey="earnings" stroke="#7c3aed" strokeWidth={2} fill="url(#earningsGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : !(subscriptionTier === 'pro' || subscriptionTier === 'pioneer') ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <ProTierPlaceholder
            title="Pro Feature"
            description="Revenue by month, sales by category, and earnings trend charts. Unlock with Pro."
            ctaLabel="Unlock with Pro"
          />
        </div>
      ) : null}

      {/* Commission Reminder */}
      <Card className="mb-8 bg-gradient-to-r from-gray-50 to-gray-100/50 border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-gray-900 mb-1">Commission Rate</p>
              <p className="text-sm text-gray-600">
                {subscriptionTier === 'pioneer' ? (
                  <>15% commission on all sales (₱15 on ₱100 sale)</>
                ) : (
                  <>20% commission on all sales (₱20 on ₱100 sale)</>
                )}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Withdrawal History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-gray-600" />
            Withdrawal History
          </CardTitle>
          <CardDescription>View all your withdrawal requests and their status</CardDescription>
        </CardHeader>
        <CardContent>
          {withdrawals.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">No withdrawals yet</p>
              <p className="text-sm text-gray-500 mt-1">Your withdrawal history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {withdrawals.map((withdrawal, index) => {
                const statusConfig = {
                  completed: {
                    icon: CheckCircle2,
                    color: 'text-green-600',
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    badgeClass: 'bg-green-600 hover:bg-green-700',
                  },
                  processing: {
                    icon: Clock,
                    color: 'text-yellow-600',
                    bgColor: 'bg-yellow-50',
                    borderColor: 'border-yellow-200',
                    badgeClass: 'bg-yellow-600 hover:bg-yellow-700',
                  },
                  failed: {
                    icon: XCircle,
                    color: 'text-red-600',
                    bgColor: 'bg-red-50',
                    borderColor: 'border-red-200',
                    badgeClass: 'bg-red-600 hover:bg-red-700',
                  },
                }
                const config = statusConfig[withdrawal.status as keyof typeof statusConfig] || statusConfig.processing
                const StatusIcon = config.icon

                return (
                  <Card
                    key={withdrawal.id}
                    className={`border ${config.borderColor} ${index !== withdrawals.length - 1 ? 'mb-0' : ''}`}
                  >
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${config.bgColor}`}>
                              <StatusIcon className={`h-5 w-5 ${config.color}`} />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <p className="text-lg font-bold text-gray-900">
                                  ₱{withdrawal.amount.toFixed(2)}
                                </p>
                                <Badge className={config.badgeClass}>
                                  {withdrawal.status}
                                </Badge>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(withdrawal.created_at).toLocaleDateString('en-US', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                  })}
                                </span>
                                <Separator orientation="vertical" className="h-4" />
                                <span className="flex items-center gap-1 uppercase">
                                  <CreditCard className="h-3 w-3" />
                                  {withdrawal.payment_method}
                                </span>
                              </div>
                            </div>
                          </div>
                          {withdrawal.transaction_reference && (
                            <div className="pl-11">
                              <p className="text-xs text-gray-500 mb-1">Transaction Reference</p>
                              <p className="text-sm font-mono text-gray-700 bg-gray-50 px-2 py-1 rounded inline-block">
                                {withdrawal.transaction_reference}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
