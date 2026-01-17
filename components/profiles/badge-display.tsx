'use client'

import { Badge } from '@/components/ui/badge'
import type { Badge as BadgeType } from '@/lib/utils/profile'

interface BadgeDisplayProps {
  badges: BadgeType[]
  className?: string
}

/**
 * BadgeDisplay Component
 * 
 * Displays user badges in the correct order with proper styling
 * Badge order: Pioneer → Pro → Verified → Top Seller → Fast Responder → Rising Star
 * 
 * Reference: docs/brainstorming/3-feature-02-user-profiles-and-profile-management.md lines 125-152
 */
export function BadgeDisplay({ badges, className }: BadgeDisplayProps) {
  if (badges.length === 0) {
    return null
  }

  const getBadgeVariant = (type: BadgeType['type']): 'default' | 'secondary' | 'outline' => {
    switch (type) {
      case 'pioneer':
        return 'default' // Gold styling via className
      case 'pro':
        return 'secondary' // Silver styling via className
      case 'verified':
        return 'default'
      default:
        return 'outline'
    }
  }

  const getBadgeClassName = (type: BadgeType['type']): string => {
    switch (type) {
      case 'pioneer':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30'
      case 'pro':
        return 'bg-gray-400/20 text-gray-700 dark:text-gray-300 border-gray-400/30'
      case 'verified':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-500/30'
      case 'top_seller':
        return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30'
      case 'fast_responder':
        return 'bg-purple-500/20 text-purple-700 dark:text-purple-400 border-purple-500/30'
      case 'rising_star':
        return 'bg-pink-500/20 text-pink-700 dark:text-pink-400 border-pink-500/30'
      default:
        return ''
    }
  }

  return (
    <div className={`flex flex-wrap gap-2 ${className || ''}`}>
      {badges.map((badge) => (
        <Badge
          key={badge.type}
          variant={getBadgeVariant(badge.type)}
          className={getBadgeClassName(badge.type)}
        >
          {badge.label}
        </Badge>
      ))}
    </div>
  )
}
