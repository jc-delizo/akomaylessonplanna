'use client'

import { useEffect, useState } from 'react'

interface PullToRefreshProps {
  onRefresh: () => Promise<void>
  children: React.ReactNode
}

export function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [startY, setStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)

  useEffect(() => {
    let touchStartY = 0
    let touchCurrentY = 0

    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartY = e.touches[0].clientY
        setStartY(touchStartY)
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (startY > 0 && window.scrollY === 0) {
        touchCurrentY = e.touches[0].clientY
        const distance = Math.max(0, touchCurrentY - touchStartY)
        setPullDistance(distance)

        if (distance > 0) {
          e.preventDefault()
        }
      }
    }

    const handleTouchEnd = async () => {
      if (pullDistance > 80 && !isRefreshing) {
        setIsRefreshing(true)
        await onRefresh()
        setIsRefreshing(false)
      }
      setPullDistance(0)
      setStartY(0)
    }

    // Only enable on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      document.addEventListener('touchstart', handleTouchStart)
      document.addEventListener('touchmove', handleTouchMove, { passive: false })
      document.addEventListener('touchend', handleTouchEnd)

      return () => {
        document.removeEventListener('touchstart', handleTouchStart)
        document.removeEventListener('touchmove', handleTouchMove)
        document.removeEventListener('touchend', handleTouchEnd)
      }
    }
  }, [pullDistance, isRefreshing, onRefresh, startY])

  return (
    <div className="relative">
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center h-16 bg-purple-600 text-white">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
          <span className="ml-2">Refreshing...</span>
        </div>
      )}
      {pullDistance > 0 && pullDistance < 80 && (
        <div
          className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center h-16 bg-gray-100"
          style={{ transform: `translateY(${Math.min(pullDistance, 80)}px)` }}
        >
          <span className="text-gray-600">Pull to refresh</span>
        </div>
      )}
      <div style={{ transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance, 80)}px)` : 'none' }}>
        {children}
      </div>
    </div>
  )
}
