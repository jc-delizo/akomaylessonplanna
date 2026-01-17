'use client'

import Link from 'next/link'
import { Package, UserCheck, MessageSquare, DollarSign, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface QuickAction {
  label: string
  href: string
  count: number
  icon: React.ComponentType<{ className?: string }>
  color: 'orange' | 'blue' | 'red' | 'green'
}

interface QuickActionsProps {
  pendingProducts: number
  verificationQueue: number
  flaggedReviews: number
  withdrawalRequests: number
}

export function QuickActions({
  pendingProducts,
  verificationQueue,
  flaggedReviews,
  withdrawalRequests,
}: QuickActionsProps) {
  const actions: QuickAction[] = [
    {
      label: 'Review Pending Products',
      href: '/admin/products/pending',
      count: pendingProducts,
      icon: Package,
      color: 'orange',
    },
    {
      label: 'Verify Teachers',
      href: '/admin/users/verification',
      count: verificationQueue,
      icon: UserCheck,
      color: 'blue',
    },
    {
      label: 'Handle Flagged Reviews',
      href: '/admin/reviews/flagged',
      count: flaggedReviews,
      icon: MessageSquare,
      color: 'red',
    },
    {
      label: 'Process Withdrawals',
      href: '/admin/financials/withdrawals',
      count: withdrawalRequests,
      icon: DollarSign,
      color: 'green',
    },
  ]

  const colorClasses = {
    orange: 'border-orange-200 bg-orange-50',
    blue: 'border-blue-200 bg-blue-50',
    red: 'border-red-200 bg-red-50',
    green: 'border-green-200 bg-green-50',
  }

  const badgeColors = {
    orange: 'bg-orange-500',
    blue: 'bg-blue-500',
    red: 'bg-red-500',
    green: 'bg-green-500',
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link key={action.href} href={action.href}>
          <Card
            className={cn(
              'p-4 hover:shadow-md transition-shadow cursor-pointer relative',
              colorClasses[action.color]
            )}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700">{action.label}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-2xl font-bold text-gray-900">{action.count}</span>
                  <span className="text-sm text-gray-600">pending</span>
                </div>
              </div>
              <action.icon className="h-8 w-8 text-gray-400" />
            </div>
            {action.count > 0 && (
              <Badge
                className={cn(
                  'absolute top-2 right-2',
                  badgeColors[action.color]
                )}
              >
                {action.count}
              </Badge>
            )}
            <div className="mt-4 flex items-center text-sm text-gray-600">
              <span>View</span>
              <ArrowRight className="h-4 w-4 ml-1" />
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
