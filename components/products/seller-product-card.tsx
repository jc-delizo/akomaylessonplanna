'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Edit, Eye, EyeOff, Send, MoreVertical, Copy, Trash2, TrendingUp, AlertCircle } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500',
  pending_review: 'bg-yellow-500',
  published: 'bg-green-500',
  rejected: 'bg-red-500',
  suspended: 'bg-orange-500',
  deleted: 'bg-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
  suspended: 'Suspended',
  deleted: 'Deleted',
}

export interface SellerProductCardProduct {
  id: string
  title: string
  price: number
  cover_image_url?: string
  grade: { name: string }
  subject: { name: string }
  status: string
  views_count: number
  sales_count: number
  avg_rating?: number
  reviews_count: number
  conversion_rate?: number
  subject_ids?: string[]
  quarter?: number
  weeks?: number[]
}

interface SellerProductCardProps {
  product: SellerProductCardProduct
  onTogglePublish: (productId: string, status: string) => void
  onDuplicate: (productId: string) => void
  onDelete: (productId: string) => void
  showTrendingBadge?: boolean
  showLowConversionBadge?: boolean
  /** Traffic source for product link: search, marketplace, direct, profile, category, other */
  trafficSource?: string
}

/** Abbreviate grade display: "Grade 1" -> "Gr 1" to conserve space */
function abbreviateGradeName(name: string): string {
  if (!name) return ''
  return name.replace(/^Grade\s+/i, 'Gr ')
}

function contextLine(product: SellerProductCardProduct): string {
  const grade = abbreviateGradeName(product.grade?.name ?? '')
  const subject =
    product.subject_ids && product.subject_ids.length > 1
      ? 'Multiple Subjects'
      : (product.subject?.name ?? '')
  return [grade, subject].filter(Boolean).join(' • ') || '—'
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

export function SellerProductCard({
  product,
  onTogglePublish,
  onDuplicate,
  onDelete,
  showTrendingBadge = false,
  showLowConversionBadge = false,
  trafficSource,
}: SellerProductCardProps) {
  const conversionRate = product.conversion_rate ?? 0
  const context = contextLine(product)
  const quarterWeeksLine = formatQuarterWeeks(product.quarter, product.weeks)
  const productHref = trafficSource ? `/products/${product.id}?source=${encodeURIComponent(trafficSource)}` : `/products/${product.id}`

  return (
    <Card className="overflow-hidden h-full flex flex-col bg-white hover:shadow-lg transition-shadow duration-200 rounded-lg p-0">
      {/* Image Section - 1:1 like ProductCard */}
      <div className="relative aspect-square bg-gray-50 overflow-hidden">
        <Link href={productHref} className="block w-full h-full">
          {product.cover_image_url ? (
            <Image
              src={product.cover_image_url}
              alt={`${product.title} - ${context}`}
              fill
              className="object-cover"
              loading="lazy"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
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
        </Link>

        {/* Status Badge - Top Right */}
        <div className="absolute top-2 right-2 z-10">
          <Badge
            className={`${STATUS_COLORS[product.status] ?? 'bg-gray-500'} text-white text-xs font-semibold px-2 py-0.5 border-0 shadow-sm`}
          >
            {STATUS_LABELS[product.status] ?? product.status}
          </Badge>
        </div>

        {/* Trending / Low conversion - Bottom Left */}
        {showTrendingBadge && (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge className="bg-orange-500 text-white text-xs shadow-sm">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          </div>
        )}
        {showLowConversionBadge && !showTrendingBadge && (
          <div className="absolute bottom-2 left-2 z-10">
            <Badge className="bg-yellow-500 text-white text-xs shadow-sm">
              <AlertCircle className="h-3 w-3 mr-1" />
              Low conversion
            </Badge>
          </div>
        )}
      </div>

      {/* Info Section - same hierarchy as ProductCard */}
      <div className="px-4 pt-0 pb-4 flex-1 flex flex-col bg-white">
        <Link href={productHref} className="min-w-0">
          <h3 className="font-bold text-base leading-tight mb-1 line-clamp-2 text-gray-900 min-h-[2.5rem] hover:text-purple-600 transition-colors">
            {product.title}
          </h3>
        </Link>
        <p className="text-sm text-gray-500 mb-1">
          {context}
        </p>
        {quarterWeeksLine && (
          <p className="text-sm text-gray-500 mb-1.5">
            {quarterWeeksLine}
          </p>
        )}
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
            {(product.sales_count ?? 0) > 0 && (
              <span className="text-gray-500 truncate shrink-0">
                {product.sales_count.toLocaleString()} sales
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 min-w-0 text-xs">
            <span className="text-gray-400">No reviews yet</span>
            {(product.sales_count ?? 0) > 0 && (
              <span className="text-gray-500 truncate shrink-0">
                {product.sales_count.toLocaleString()} sales
              </span>
            )}
          </div>
        )}

        {/* Views - only on seller card, subtle */}
        {(product.views_count ?? 0) > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <Eye className="h-3.5 w-3.5 shrink-0" />
            <span>{product.views_count.toLocaleString()} views</span>
            {conversionRate > 0 && (
              <span className="shrink-0">· {conversionRate.toFixed(1)}%</span>
            )}
          </div>
        )}

        {/* Actions - Edit + three-dots */}
        <div className="flex items-center gap-2 mt-3">
          <Link href={`/shop/products/${product.id}/edit`} className="flex-1 min-w-0">
            <Button variant="outline" size="sm" className="w-full">
              <Edit className="h-3 w-3 mr-1.5" />
              Edit
            </Button>
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onTogglePublish(product.id, product.status)}
              >
                {product.status === 'published' ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Unpublish
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Publish
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDuplicate(product.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(product.id)}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Card>
  )
}
