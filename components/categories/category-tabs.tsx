'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Tab {
  label: string
  slug: string
  count: number
  href: string
}

interface CategoryTabsProps {
  tabs: Tab[]
  activeTab?: string
}

export function CategoryTabs({ tabs, activeTab }: CategoryTabsProps) {
  const pathname = usePathname()

  if (tabs.length === 0) {
    return null
  }

  return (
    <div className="border-b border-gray-200 mb-6">
      <div className="flex flex-wrap gap-2 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.slug || pathname === tab.href
          return (
            <Link
              key={tab.slug}
              href={tab.href}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${isActive
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }
              `}
            >
              {tab.label} ({tab.count})
            </Link>
          )
        })}
      </div>
    </div>
  )
}
