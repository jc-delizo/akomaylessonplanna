'use client'

import { Card, CardContent } from '@/components/ui/card'
import { getProfileCompletionLevel } from '@/lib/utils/profile'

interface ProfileCompletionIndicatorProps {
  percentage: number
  className?: string
}

/**
 * ProfileCompletionIndicator Component
 * 
 * Visual indicator showing profile completion percentage
 * Color coding: 0-49% (red), 50-79% (yellow), 80-99% (blue), 100% (green)
 * 
 * Reference: docs/brainstorming/3-feature-02-user-profiles-and-profile-management.md lines 236-262
 */
export function ProfileCompletionIndicator({
  percentage,
  className,
}: ProfileCompletionIndicatorProps) {
  const { level, message, color } = getProfileCompletionLevel(percentage)

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30'
      case 'yellow':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
      case 'blue':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'
      case 'green':
        return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
      default:
        return 'bg-gray-500/20 text-gray-700 dark:text-gray-400 border-gray-500/30'
    }
  }

  return (
    <Card className={className}>
      <CardContent className="pt-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Profile Completion</span>
            <span className="text-sm font-bold">{percentage}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${
                color === 'red'
                  ? 'bg-red-500'
                  : color === 'yellow'
                    ? 'bg-yellow-500'
                    : color === 'blue'
                      ? 'bg-blue-500'
                      : 'bg-green-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <p className={`text-xs ${getColorClasses(color)} px-2 py-1 rounded`}>{message}</p>
        </div>
      </CardContent>
    </Card>
  )
}
