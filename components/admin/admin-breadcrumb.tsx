'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href: string
}

export function AdminBreadcrumb() {
  const pathname = usePathname()

  // Don't show breadcrumb on dashboard
  if (pathname === '/admin/dashboard' || pathname === '/admin') {
    return null
  }

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const segments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/admin/dashboard' },
    ]

    // Map path segments to readable labels
    const labelMap: Record<string, string> = {
      users: 'Users',
      products: 'Products',
      reviews: 'Reviews',
      reports: 'Reports',
      pioneers: 'Pioneers',
      financials: 'Financials',
      announcements: 'Announcements',
      analytics: 'Analytics',
      settings: 'Settings',
      verification: 'Verification Queue',
      banned: 'Banned Users',
      notes: 'Admin Notes',
      pending: 'Pending Reviews',
      all: 'All Products',
      suspended: 'Suspended Products',
      history: 'Review History',
      flagged: 'Flagged Reviews',
      revenue: 'Revenue Overview',
      withdrawals: 'Withdrawals',
      'payout-history': 'Payout History',
      'financial-reports': 'Financial Reports',
      create: 'Create',
      templates: 'Templates',
      platform: 'Platform Settings',
      features: 'Feature Flags',
      email: 'Email Settings',
      payments: 'Payment Settings',
      system: 'System Status',
      admins: 'Admin Management',
      growth: 'Platform Growth',
      sellers: 'Seller Performance',
      buyers: 'Buyer Behavior',
      geographic: 'Geographic Data',
      analytics: 'Search Analytics',
      popular: 'Popular Searches',
      categories: 'Category Management',
      seo: 'SEO Tools',
      tickets: 'Support Tickets',
      disputes: 'Dispute Resolution',
      activity: 'Activity Log',
    }

    let currentPath = '/admin'
    for (let i = 1; i < segments.length; i++) {
      const segment = segments[i]
      currentPath += `/${segment}`
      
      const label = labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
      breadcrumbs.push({ label, href: currentPath })
    }

    return breadcrumbs
  }

  const breadcrumbs = generateBreadcrumbs()

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1
        return (
          <div key={item.href} className="flex items-center space-x-2">
            {index === 0 ? (
              <Link
                href={item.href}
                className="flex items-center hover:text-gray-900 transition-colors"
              >
                <Home className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <ChevronRight className="h-4 w-4 text-gray-400" />
                {isLast ? (
                  <span className="text-gray-900 font-medium">{item.label}</span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-gray-900 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </>
            )}
          </div>
        )
      })}
    </nav>
  )
}
