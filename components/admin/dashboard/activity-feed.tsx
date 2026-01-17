'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface ActivityItem {
  id: string
  type: 'approval' | 'issue' | 'sale' | 'other'
  action: string
  target: string
  admin?: string
  timestamp: string
}

interface ActivityFeedProps {
  activities: ActivityItem[]
}

const filterOptions = ['All', 'Approvals', 'Issues', 'Sales'] as const
type FilterType = typeof filterOptions[number]

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const [filter, setFilter] = useState<FilterType>('All')

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'All') return true
    if (filter === 'Approvals') return activity.type === 'approval'
    if (filter === 'Issues') return activity.type === 'issue'
    if (filter === 'Sales') return activity.type === 'sale'
    return true
  })

  const getTypeColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'approval':
        return 'bg-green-100 text-green-700'
      case 'issue':
        return 'bg-red-100 text-red-700'
      case 'sale':
        return 'bg-blue-100 text-blue-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Recent Activity</h3>
        <div className="flex gap-2">
          {filterOptions.map((option) => (
            <button
              key={option}
              onClick={() => setFilter(option)}
              className={cn(
                'px-3 py-1 text-sm rounded-lg transition-colors',
                filter === option
                  ? 'bg-purple-100 text-purple-700 font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {filteredActivities.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No activities found</p>
        ) : (
          filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Badge className={cn('shrink-0', getTypeColor(activity.type))}>
                {activity.type}
              </Badge>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900">
                  <span className="font-medium">{activity.action}</span>
                  <span className="text-gray-600"> {activity.target}</span>
                </p>
                {activity.admin && (
                  <p className="text-xs text-gray-500 mt-1">by {activity.admin}</p>
                )}
              </div>
              <span className="text-xs text-gray-500 shrink-0">
                {formatTime(activity.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </Card>
  )
}
