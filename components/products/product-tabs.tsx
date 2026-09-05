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

  return (
    <section className="py-12 sm:py-16" aria-labelledby="marketplace-products-title">
      <div className="mb-7 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-700">Discover resources</p>
          <h2 id="marketplace-products-title" className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Explore teacher-made materials
          </h2>
        </div>
        <p className="max-w-md text-sm leading-6 text-slate-600 sm:text-right">
          Find practical resources for your next class, created by fellow educators.
        </p>
      </div>

      <div
        className="-mx-4 mb-8 flex items-center gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:flex-wrap sm:px-0"
        role="tablist"
        aria-label="Product collections"
      >
        {tabs.map((tab) => {
          const isRecommended = tab.id === 'recommended'
          if (tab.count === 0 && !isRecommended) return null

          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? 'border-[#f36d21] bg-[#f36d21] text-white shadow-sm'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-800'
              }`}
              aria-selected={isActive}
              aria-controls={`panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              role="tab"
            >
              {tab.label} {tab.count > 0 && `(${tab.count})`}
            </button>
          )
        })}
      </div>

      <div
        id={`panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        tabIndex={0}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-4"
      >
        {activeProducts.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {activeProducts.map((product) => (
              <ProductCard key={product.id} product={product} trafficSource="marketplace" />
            ))}
          </div>
        ) : activeTab === 'recommended' && recommendedProducts.length === 0 && !teachingComplete ? (
          <div className="rounded-2xl border border-orange-100 bg-orange-50/60 px-5 py-10 text-center sm:px-8">
            <h3 className="text-lg font-bold text-slate-900">Make your recommendations more useful</h3>
            <p className="mx-auto mb-5 mt-2 max-w-md text-sm leading-6 text-slate-600">
              Tell us what you teach—grade level and subjects—in your profile so we can recommend the most relevant resources for you.
            </p>
            <Link
              href="/profile/edit"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-[#f36d21] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#dc5d16]"
            >
              Complete your profile
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-12 text-center text-sm text-slate-500">
            <p>No resources are available in this collection yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}
