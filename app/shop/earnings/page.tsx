'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings...</p>
        </div>
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
      <h1 className="text-3xl font-bold mb-6">Earnings</h1>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">Available for Withdrawal</h3>
          <p className="text-3xl font-bold text-green-600">
            ₱{earnings.available_balance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Minimum withdrawal: ₱500
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">Pending Balance</h3>
          <p className="text-3xl font-bold text-yellow-600">
            ₱{earnings.pending_balance.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Processing (3-day hold period)
          </p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm text-gray-600 mb-2">Total Lifetime Earnings</h3>
          <p className="text-3xl font-bold text-purple-600">
            ₱{earnings.total_earnings.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            All-time total
          </p>
        </Card>
      </div>

      {/* Withdrawal Section */}
      <Card className="p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Request Withdrawal</h2>
          {!showWithdrawalForm && (
            <Button
              onClick={() => setShowWithdrawalForm(true)}
              disabled={!canWithdraw}
            >
              Request Withdrawal
            </Button>
          )}
        </div>

        {showWithdrawalForm && (
          <div className="border-t pt-6 space-y-4">
            <div>
              <Label htmlFor="amount">Withdrawal Amount</Label>
              <Input
                id="amount"
                type="number"
                min="500"
                max={earnings.available_balance}
                step="0.01"
                value={withdrawalAmount}
                onChange={(e) => setWithdrawalAmount(e.target.value)}
                placeholder={`₱${earnings.available_balance.toFixed(2)}`}
              />
              <p className="text-xs text-gray-500 mt-1">
                Available: ₱{earnings.available_balance.toFixed(2)} • Minimum: ₱500
              </p>
            </div>

            <div>
              <Label>Withdraw to</Label>
              <div className="flex gap-4 mt-2">
                <button
                  onClick={() => setPaymentMethod('gcash')}
                  className={`flex-1 p-4 border-2 rounded-lg text-left ${
                    paymentMethod === 'gcash'
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'gcash'
                          ? 'border-blue-600 bg-blue-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'gcash' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="font-semibold">GCash</span>
                  </div>
                </button>
                <button
                  onClick={() => setPaymentMethod('maya')}
                  className={`flex-1 p-4 border-2 rounded-lg text-left ${
                    paymentMethod === 'maya'
                      ? 'border-orange-600 bg-orange-50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'maya'
                          ? 'border-orange-600 bg-orange-600'
                          : 'border-gray-300'
                      }`}
                    >
                      {paymentMethod === 'maya' && (
                        <div className="w-2 h-2 rounded-full bg-white" />
                      )}
                    </div>
                    <span className="font-semibold">Maya</span>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                className="flex-1"
                onClick={handleWithdrawal}
                disabled={withdrawing || !withdrawalAmount || parseFloat(withdrawalAmount) < 500}
              >
                {withdrawing ? 'Processing...' : 'Request Withdrawal'}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowWithdrawalForm(false)
                  setWithdrawalAmount('')
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Earnings Breakdown */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Earnings Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">This Week</p>
            <p className="text-2xl font-bold">₱{earnings.this_week.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">This Month</p>
            <p className="text-2xl font-bold">₱{earnings.this_month.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">All Time</p>
            <p className="text-2xl font-bold">₱{earnings.all_time.toFixed(2)}</p>
          </div>
        </div>

        {/* Projected Earnings (Pro/Pioneer) */}
        {earnings.projected && (subscriptionTier === 'pro' || subscriptionTier === 'pioneer') && (
          <div className="mt-6 p-4 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Projected Earnings This Month</p>
            <p className="text-2xl font-bold text-purple-700">
              ₱{earnings.projected.amount.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {earnings.projected.growth >= 0 ? '+' : ''}
              {earnings.projected.growth.toFixed(1)}% vs last month
            </p>
          </div>
        )}
      </Card>

      {/* Pro/Pioneer Charts */}
      {(subscriptionTier === 'pro' || subscriptionTier === 'pioneer') && earnings.charts && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue by Month */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Revenue by Month</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p>Interactive bar chart (Pro/Pioneer feature)</p>
                <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
                <div className="mt-4 space-y-2 text-left">
                  {earnings.charts.revenueByMonth.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.month}:</span>
                      <span className="font-semibold">₱{item.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Sales by Category */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Sales by Product Category</h3>
            <div className="h-64 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <p>Interactive pie chart (Pro/Pioneer feature)</p>
                <p className="text-sm mt-2">Full implementation with Recharts/Chart.js</p>
                <div className="mt-4 space-y-2 text-left">
                  {earnings.charts.salesByCategory.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.category.replace('_', ' ')}:</span>
                      <span className="font-semibold">₱{item.revenue.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* Earnings Trend */}
          <Card className="p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold mb-4">Earnings Trend (Last 30 Days)</h3>
            <div className="h-64">
              {/* Simple line chart for now */}
              <div className="h-full flex items-end justify-between gap-1">
                {earnings.charts.earningsTrend.slice(-30).map((point, index) => {
                  const maxEarnings = Math.max(
                    ...earnings.charts!.earningsTrend.map((p) => p.earnings),
                    1
                  )
                  const height = (point.earnings / maxEarnings) * 100
                  return (
                    <div key={index} className="flex-1 flex flex-col items-center">
                      <div
                        className="w-full bg-purple-600 rounded-t transition-all"
                        style={{ height: `${height}%`, minHeight: '4px' }}
                        title={`${point.date}: ₱${point.earnings.toFixed(2)}`}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Commission Reminder */}
      <Card className="p-4 mb-8 bg-gray-50">
        <p className="text-sm text-gray-600">
          {subscriptionTier === 'pioneer' ? (
            <>15% commission on all sales (₱15 on ₱100 sale)</>
          ) : (
            <>20% commission on all sales (₱20 on ₱100 sale)</>
          )}
        </p>
      </Card>

      {/* Withdrawal History */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Withdrawal History</h2>
        {withdrawals.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No withdrawals yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-4">Date</th>
                  <th className="text-left py-2 px-4">Amount</th>
                  <th className="text-left py-2 px-4">Method</th>
                  <th className="text-left py-2 px-4">Status</th>
                  <th className="text-left py-2 px-4">Reference</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="border-b">
                    <td className="py-2 px-4">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 font-semibold">
                      ₱{withdrawal.amount.toFixed(2)}
                    </td>
                    <td className="py-2 px-4 uppercase">{withdrawal.payment_method}</td>
                    <td className="py-2 px-4">
                      <Badge
                        className={
                          withdrawal.status === 'completed'
                            ? 'bg-green-600'
                            : withdrawal.status === 'processing'
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                        }
                      >
                        {withdrawal.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-4 text-sm text-gray-600 font-mono">
                      {withdrawal.transaction_reference || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}
