'use client'

import { Badge } from '@/components/ui/badge'
import { Sparkles, TrendingUp, Trophy, Star } from 'lucide-react'

export type ProductBadgeType = 'new' | 'trending' | 'bestseller' | 'popular'

interface ProductBadgeProps {
  badge: ProductBadgeType | null
  className?: string
}

const badgeConfig: Record<
  ProductBadgeType,
  { label: string; icon: React.ReactNode; className: string }
> = {
  new: {
    label: 'New',
    icon: <Sparkles className="h-3 w-3" />,
    className: 'bg-blue-500 text-white',
  },
  trending: {
    label: 'Trending',
    icon: <TrendingUp className="h-3 w-3" />,
    className: 'bg-orange-500 text-white',
  },
  bestseller: {
    label: 'Bestseller',
    icon: <Trophy className="h-3 w-3" />,
    className: 'bg-yellow-500 text-white',
  },
  popular: {
    label: 'Popular',
    icon: <Star className="h-3 w-3" />,
    className: 'bg-purple-500 text-white',
  },
}

export function ProductBadge({ badge, className }: ProductBadgeProps) {
  if (!badge) {
    return null
  }

  const config = badgeConfig[badge]

  return (
    <Badge
      className={`${config.className} ${className || ''} flex items-center gap-1 text-xs font-semibold`}
    >
      {config.icon}
      {config.label}
    </Badge>
  )
}
