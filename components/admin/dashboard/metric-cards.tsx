'use client'

import { Card } from '@/components/ui/card'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: string | number
  trend?: {
    value: number
    label: string
  }
  icon?: React.ReactNode
  className?: string
}

export function MetricCard({ title, value, trend, icon, className }: MetricCardProps) {
  const isPositive = trend && trend.value >= 0

  return (
    <Card className={cn('p-6', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
          {trend && (
            <div className={cn('flex items-center gap-1 mt-2 text-sm', isPositive ? 'text-green-600' : 'text-red-600')}>
              {isPositive ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-500">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
    </Card>
  )
}

interface MetricCardsProps {
  metrics: {
    totalRevenue: number
    totalOrders: number
    newSignups: number
    productsListed: number
    activeSellers: number
    approvalRate: number
    platformRating: number
    supportTickets: number
  }
}

export function MetricCards({ metrics }: MetricCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Row 1: Revenue & Growth */}
      <MetricCard
        title="Total Revenue"
        value={formatCurrency(metrics.totalRevenue)}
      />
      <MetricCard
        title="Total Orders"
        value={metrics.totalOrders.toLocaleString()}
      />
      <MetricCard
        title="New Signups"
        value={metrics.newSignups.toLocaleString()}
      />
      <MetricCard
        title="Products Listed"
        value={metrics.productsListed.toLocaleString()}
      />

      {/* Row 2: Platform Health */}
      <MetricCard
        title="Active Sellers"
        value={metrics.activeSellers.toLocaleString()}
      />
      <MetricCard
        title="Approval Rate"
        value={`${metrics.approvalRate}%`}
      />
      <MetricCard
        title="Platform Rating"
        value={`${metrics.platformRating.toFixed(1)} ⭐`}
      />
      <MetricCard
        title="Support Tickets"
        value={metrics.supportTickets.toLocaleString()}
      />
    </div>
  )
}
