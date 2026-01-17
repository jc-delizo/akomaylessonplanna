'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Package,
  MessageSquare,
  Flag,
  Award,
  DollarSign,
  Megaphone,
  BarChart3,
  Settings,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { Button } from '@/components/ui/button'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  permission?: string
  children?: NavItem[]
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Users',
    href: '/admin/users',
    icon: Users,
    children: [
      { label: 'All Users', href: '/admin/users', icon: Users },
      { label: 'Verification Queue', href: '/admin/users/verification', icon: Users },
      { label: 'Banned Users', href: '/admin/users/banned', icon: Users },
      { label: 'Admin Notes', href: '/admin/users/notes', icon: Users },
    ],
  },
  {
    label: 'Products',
    href: '/admin/products',
    icon: Package,
    children: [
      { label: 'Pending Reviews', href: '/admin/products/pending', icon: Package },
      { label: 'All Products', href: '/admin/products/all', icon: Package },
      { label: 'Suspended Products', href: '/admin/products/suspended', icon: Package },
      { label: 'Review History', href: '/admin/products/history', icon: Package },
    ],
  },
  {
    label: 'Reviews',
    href: '/admin/reviews/flagged',
    icon: MessageSquare,
  },
  {
    label: 'Messages',
    href: '/admin/messages',
    icon: MessageSquare,
    children: [
      { label: 'Flagged Messages', href: '/admin/messages/flagged', icon: Flag },
      { label: 'Disputes', href: '/admin/messages/disputes', icon: Flag },
      { label: 'All Conversations', href: '/admin/messages/conversations', icon: MessageSquare },
    ],
  },
  {
    label: 'Reports',
    href: '/admin/reports',
    icon: Flag,
  },
  {
    label: 'Pioneers',
    href: '/admin/pioneers',
    icon: Award,
  },
  {
    label: 'Financials',
    href: '/admin/financials',
    icon: DollarSign,
    permission: 'view_financials',
  },
  {
    label: 'Announcements',
    href: '/admin/announcements',
    icon: Megaphone,
  },
  {
    label: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3,
    children: [
      { label: 'Email Analytics', href: '/admin/analytics/email', icon: BarChart3 },
    ],
  },
  {
    label: 'Settings',
    href: '/admin/settings',
    icon: Settings,
    permission: 'view_settings',
    children: [
      { label: 'Platform', href: '/admin/settings/platform', icon: Settings },
      { label: 'Admins', href: '/admin/settings/admins', icon: Settings },
      { label: 'Email', href: '/admin/settings/email', icon: Settings },
    ],
  },
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const { checkPermission, isSuperAdmin } = useAdminAuth()

  const toggleExpanded = (href: string) => {
    setExpandedItems((prev) =>
      prev.includes(href) ? prev.filter((item) => item !== href) : [...prev, href]
    )
  }

  const isActive = (href: string) => {
    if (href === '/admin/dashboard') return pathname === href
    return pathname.startsWith(href)
  }

  const canAccess = (item: NavItem): boolean => {
    if (!item.permission) return true
    return checkPermission(item.permission as any)
  }

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-white border-r transition-transform duration-300',
          'md:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex h-16 items-center border-b px-4">
            <Link href="/admin/dashboard" className="flex items-center gap-2">
              <Image
                src="/android-chrome-192x192.png"
                alt="Akomay Lesson Planna"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="font-bold text-lg">Admin Panel</span>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              if (!canAccess(item)) return null

              const hasChildren = item.children && item.children.length > 0
              const isExpanded = expandedItems.includes(item.href)
              const active = isActive(item.href)

              return (
                <div key={item.href}>
                  {hasChildren ? (
                    <>
                      <button
                        onClick={() => toggleExpanded(item.href)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                          active
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        )}
                      >
                        <item.icon className="h-5 w-5" />
                        <span className="flex-1 text-left">{item.label}</span>
                        <span
                          className={cn(
                            'transition-transform',
                            isExpanded ? 'rotate-90' : ''
                          )}
                        >
                          ›
                        </span>
                      </button>
                      {isExpanded && (
                        <div className="ml-8 mt-1 space-y-1">
                          {item.children?.map((child) => {
                            if (!canAccess(child)) return null
                            const childActive = isActive(child.href)
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                                  childActive
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'text-gray-600 hover:bg-gray-100'
                                )}
                                onClick={() => setIsOpen(false)}
                              >
                                <child.icon className="h-4 w-4" />
                                <span>{child.label}</span>
                              </Link>
                            )
                          })}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                        active
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                      onClick={() => setIsOpen(false)}
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </Link>
                  )}
                </div>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="border-t p-4">
            <Link
              href="/marketplace"
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              ← Back to Marketplace
            </Link>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}
