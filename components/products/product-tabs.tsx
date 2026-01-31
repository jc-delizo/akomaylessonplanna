'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ProductCard } from './product-card'

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
    name: string
    username: string
    avatar_url?: string
    is_verified_teacher?: boolean
  }
  grade: {
    id: string
    name: string
  }
  subject: {
    id: string
    name: string
  }
}

interface ProductTabsProps {
  featuredProducts?: Product[]
  newProducts?: Product[]
  trendingProducts?: Product[]
  bestsellerProducts?: Product[]
  recommendedProducts?: Product[]
  /** When false, Recommended empty state shows profile prompt. Default true for backward compatibility. */
  teachingComplete?: boolean
}

type TabType = 'featured' | 'new' | 'trending' | 'bestsellers' | 'recommended'

export function ProductTabs({
  featuredProducts = [],
  newProducts = [],
  trendingProducts = [],
  bestsellerProducts = [],
  recommendedProducts = [],
  teachingComplete = true,
}: ProductTabsProps) {
  const tabs = [
    {
      id: 'featured' as TabType,
      label: 'Featured Products',
      products: featuredProducts,
      count: featuredProducts.length,
    },
    {
      id: 'new' as TabType,
      label: 'New Arrivals',
      products: newProducts,
      count: newProducts.length,
    },
    {
      id: 'trending' as TabType,
      label: 'Trending Now',
      products: trendingProducts,
      count: trendingProducts.length,
    },
    {
      id: 'bestsellers' as TabType,
      label: 'Best Sellers',
      products: bestsellerProducts,
      count: bestsellerProducts.length,
    },
    {
      id: 'recommended' as TabType,
      label: 'Recommended for You',
      products: recommendedProducts,
      count: recommendedProducts.length,
    },
  ]

  // Default tab: New Arrivals first, then first tab with content, then Recommended (for empty state)
  const defaultTab: TabType =
    newProducts.length > 0
      ? 'new'
      : (tabs.find((t) => t.count > 0)?.id ?? 'recommended')
  const [activeTab, setActiveTab] = useState<TabType>(defaultTab)

  const activeTabData = tabs.find((tab) => tab.id === activeTab)
  const activeProducts = activeTabData?.products || []

  // Always render: we show Recommended for You even when empty (for profile prompt or generic empty)
  return (
    <section className="mb-16">
      {/* Pill Tabs: show tab if it has count > 0, or always show Recommended for You */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        {tabs.map((tab) => {
          const isRecommended = tab.id === 'recommended'
          if (tab.count === 0 && !isRecommended) return null

          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? 'bg-[#ff7200] text-white hover:bg-[#e66500] scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900'
                }
              `}
              aria-selected={isActive}
              role="tab"
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          )
        })}
      </div>

      {/* Product Grid or Empty State */}
      {activeProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7 gap-4 md:gap-6">
          {activeProducts.map((product) => (
            <ProductCard key={product.id} product={product} trafficSource="marketplace" />
          ))}
        </div>
      ) : activeTab === 'recommended' && recommendedProducts.length === 0 && !teachingComplete ? (
        <div className="text-center py-12 px-4">
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            We don&apos;t know enough about you yet! Tell us what you teach—grade level and subjects—in your profile so we can recommend the best resources for you.
          </p>
          <Link
            href="/profile/edit"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg bg-[#ff7200] text-white text-sm font-medium hover:bg-[#e66500] transition-colors"
          >
            Complete your profile
          </Link>
        </div>
      ) : (
        <div className="text-center py-12 text-gray-500">
          <p>No products available in this category.</p>
        </div>
      )}
    </section>
  )
}
