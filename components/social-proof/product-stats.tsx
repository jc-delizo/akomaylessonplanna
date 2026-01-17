'use client'

import { Eye, ShoppingBag, Heart } from 'lucide-react'
import { formatCount } from '@/lib/social-proof/calculate-badges-client'

interface ProductStatsProps {
  viewsCount?: number
  salesCount?: number
  wishlistCount?: number
  className?: string
}

export function ProductStats({
  viewsCount = 0,
  salesCount = 0,
  wishlistCount = 0,
  className,
}: ProductStatsProps) {
  return (
    <div className={`flex items-center gap-4 text-sm text-gray-600 ${className || ''}`}>
      {viewsCount > 0 && (
        <div className="flex items-center gap-1">
          <Eye className="h-4 w-4" />
          <span>{formatCount(viewsCount)} views</span>
        </div>
      )}
      {salesCount > 0 && (
        <div className="flex items-center gap-1">
          <ShoppingBag className="h-4 w-4" />
          <span>{formatCount(salesCount)} sales</span>
        </div>
      )}
      {wishlistCount > 0 && (
        <div className="flex items-center gap-1">
          <Heart className="h-4 w-4" />
          <span>{formatCount(wishlistCount)} wishlisted</span>
        </div>
      )}
    </div>
  )
}
