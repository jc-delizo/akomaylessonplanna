'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { ProductBadge } from '@/components/social-proof/product-badge'
import { calculateProductBadgeClient } from '@/lib/social-proof/calculate-badges-client'

interface Product {
  id: string
  title: string
  description: string
  price: number
  cover_image_url?: string
  product_type: string
  avg_rating?: number
  reviews_count?: number
  sales_count?: number
  views_count?: number
  created_at?: string
  badges?: string[]
  seller: {
    id: string
    name?: string
    first_name?: string
    last_name?: string
    username: string
    avatar_url?: string
    is_verified_teacher?: boolean
  }
  grade?: { id: string; name: string } | null
  subject?: { id: string; name: string; code?: string } | null
  class_type?: string | null
  strand?: { id: string; name: string; code?: string } | null
  sped_level?: { id: string; name: string } | null
  subject_ids?: string[]
  quarter?: number
  weeks?: number[]
  wishlist_count?: number
  computed_badge?: string | null
}

interface ProductCardProps {
  product: Product
  showSeller?: boolean
  searchQuery?: string // Optional: if product was shown in search results
}

/** Abbreviate grade display: "Grade 1" -> "Gr 1" to conserve space */
function abbreviateGradeName(name: string): string {
  if (!name) return ''
  return name.replace(/^Grade\s+/i, 'Gr ')
}

function productContextLine(product: Product): string {
  const subjectName =
    product.subject_ids && product.subject_ids.length > 1
      ? 'Multiple Subjects'
      : (product.subject?.name ?? '')
  if (product.class_type === 'sped' && product.sped_level?.name) {
    return [product.sped_level.name, subjectName].filter(Boolean).join(' • ')
  }
  if (product.class_type === 'regular' && product.strand?.name) {
    const gradeName = abbreviateGradeName(product.grade?.name ?? '')
    return [gradeName, product.strand.name, subjectName].filter(Boolean).join(' • ')
  }
  const gradeName = abbreviateGradeName(product.grade?.name ?? '')
  return [gradeName, subjectName].filter(Boolean).join(' • ')
}

function formatQuarterWeeks(quarter?: number, weeks?: number[]): string {
  const hasQuarter = quarter != null
  const hasWeeks = weeks && weeks.length > 0
  if (!hasQuarter && !hasWeeks) return ''
  if (hasQuarter && hasWeeks) {
    const min = Math.min(...weeks!)
    const max = Math.max(...weeks!)
    return `Quarter ${quarter}: W${min}-W${max}`
  }
  if (hasQuarter) return `Quarter ${quarter}`
  if (hasWeeks) {
    const min = Math.min(...weeks!)
    const max = Math.max(...weeks!)
    return `W${min}-W${max}`
  }
  return ''
}

export function ProductCard({ product, showSeller = true, searchQuery }: ProductCardProps) {
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [badge, setBadge] = useState<'new' | 'trending' | 'bestseller' | 'popular' | null>(null)
  const supabase = createClient()
  const contextLine = productContextLine(product)
  const quarterWeeksLine = formatQuarterWeeks(product.quarter, product.weeks)
  const validBadges = ['new', 'trending', 'bestseller', 'popular'] as const
  const displayBadge = product.computed_badge && validBadges.includes(product.computed_badge as typeof validBadges[number]) ? product.computed_badge as typeof validBadges[number] : badge
  const sellerName = product.seller?.name ?? (
    [product.seller?.first_name, product.seller?.last_name].filter(Boolean).join(' ').trim() || ''
  )
  useEffect(() => {
    let cancelled = false
    let abortController: AbortController | null = null

    const checkWishlistStatus = async () => {
      if (cancelled) {
        return
      }

      // Cancel previous request if still pending
      if (abortController) {
        abortController.abort()
      }
      abortController = new AbortController()

      try {
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || cancelled) return

        const response = await fetch(`/api/wishlist?product_id=${product.id}`, {
          signal: abortController.signal,
        })

        if (cancelled) return

        if (response.ok) {
          const data = await response.json()
          if (!cancelled) {
            setIsInWishlist(data.isInWishlist || false)
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, ignore silently
          return
        }
        if (!cancelled) {
          console.error('Error checking wishlist status:', error)
        }
      }
    }

    checkWishlistStatus()
    calculateBadge()

    return () => {
      cancelled = true
      if (abortController) {
        abortController.abort()
      }
    }
  }, [product.id, product.computed_badge])

  const calculateBadge = () => {
    if (product.computed_badge && ['new', 'trending', 'bestseller', 'popular'].includes(product.computed_badge)) {
      setBadge(product.computed_badge as 'new' | 'trending' | 'bestseller' | 'popular')
      return
    }
    try {
      const calculatedBadge = calculateProductBadgeClient({
        id: product.id,
        created_at: product.created_at,
        views_count: product.views_count,
        sales_count: product.sales_count,
        wishlist_count: product.wishlist_count ?? 0,
      })
      setBadge(calculatedBadge)
    } catch (error) {
      console.error('Error calculating badge:', error)
    }
  }

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      setIsToggling(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        window.location.href = '/login'
        return
      }

      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id }),
        })
        if (response.ok) {
          setIsInWishlist(false)
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id }),
        })
        if (response.ok) {
          setIsInWishlist(true)
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
    } finally {
      setIsToggling(false)
    }
  }

  const handleProductClick = () => {
    // Track search click if product was viewed from search results
    const query = searchQuery || new URLSearchParams(window.location.search).get('q') || new URLSearchParams(window.location.search).get('query')
    if (query) {
      // Track click asynchronously
      fetch('/api/search/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          search_term: query
        })
      }).catch(() => {})
    }
  }

  return (
    <Link href={`/products/${product.id}`} prefetch={false} onClick={handleProductClick}>
      <Card className="overflow-hidden h-full flex flex-col group bg-white hover:shadow-lg transition-shadow duration-200 rounded-lg p-0">
        {/* Image Section - Clean and Simple */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {product.cover_image_url ? (
            <Image
              src={product.cover_image_url}
              alt={`${product.title} - ${contextLine || 'K-12'} lesson plan`}
              fill
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
              <svg
                className="w-12 h-12"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          )}

          {/* Single trust badge: prefer cron-computed, else client-calculated, else Featured */}
          <div className="absolute top-2 left-2 flex flex-col gap-1.5 z-10">
            {displayBadge ? (
              <ProductBadge badge={displayBadge} />
            ) : product.badges && product.badges.includes('featured') ? (
              <Badge className="bg-purple-600 text-white text-xs font-semibold px-2 py-0.5 border-0 shadow-sm">
                FEATURED
              </Badge>
            ) : null}
          </div>

          {/* Wishlist Button - Top Right (Simple) */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 bg-white/90 hover:bg-white shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10 h-8 w-8 rounded-full"
            onClick={handleWishlistToggle}
            disabled={isToggling}
            title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          >
            <Heart
              className={`w-4 h-4 ${
                isInWishlist 
                  ? 'fill-red-500 text-red-500' 
                  : 'text-gray-600'
              }`}
            />
          </Button>
        </div>

        {/* Info Section - Clean Typography Hierarchy */}
        <div className="px-4 pt-0 pb-4 flex-1 flex flex-col bg-white">
          {/* Product Title - Large and Bold (Primary Focus) - no margin/min-height to remove gap above seller */}
          <h3 className="font-bold text-base leading-tight mb-0 line-clamp-2 text-gray-900">
            {product.title}
          </h3>

          {/* Seller - same height as "No reviews yet" row (text-xs) */}
          {showSeller && sellerName && (
            <p className="text-xs text-gray-500 leading-4 mb-0 mt-0">
              by {sellerName}
            </p>
          )}

          {/* Grade and Subject - Secondary Info (Phase 2: Level • Subject or Grade • Strand • Subject; Multiple Subjects when subject_ids.length > 1) */}
          <p className="text-sm text-gray-500 mt-1.5 mb-1">
            {contextLine || '—'}
          </p>

          {/* Quarter and Weeks - below Grade • Subject */}
          {quarterWeeksLine && (
            <p className="text-sm text-gray-500 mb-1.5">
              {quarterWeeksLine}
            </p>
          )}

          {/* Price - Prominent Display */}
          <div className="mb-1.5">
            <p className="text-xl font-bold text-orange-600">
              ₱{product.price.toFixed(2)}
            </p>
          </div>

          {/* Rating and Sales - one line, no wrap */}
          {product.avg_rating ? (
            <div className="flex items-center justify-between gap-2 min-w-0 text-xs">
              <div className="flex items-center gap-1 min-w-0 shrink-0">
                <svg
                  className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="font-medium text-gray-700 truncate">
                  {product.avg_rating.toFixed(1)}
                  {(product.reviews_count ?? 0) > 0 && ` (${product.reviews_count})`}
                </span>
              </div>
              {(product.sales_count ?? 0) > 0 && product.sales_count && (
                <span className="text-gray-500 truncate shrink-0">
                  {product.sales_count.toLocaleString()} sales
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 min-w-0 text-xs">
              <span className="text-gray-400">No reviews yet</span>
              {(product.sales_count ?? 0) > 0 && product.sales_count && (
                <span className="text-gray-500 truncate shrink-0">
                  {product.sales_count.toLocaleString()} sales
                </span>
              )}
            </div>
          )}
        </div>
      </Card>
    </Link>
  )
}
