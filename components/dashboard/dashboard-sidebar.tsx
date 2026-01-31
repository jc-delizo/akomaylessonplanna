'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Home,
  Package,
  Palette,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Star,
  MessageSquare,
  Settings,
  Sparkles,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface DashboardSidebarProps {
  user?: {
    id: string
    name: string
    avatar_url?: string | null
    subscription_tier?: 'free' | 'pro' | 'pioneer'
    role?: 'buyer' | 'seller' | 'admin'
  }
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const navigationItems = [
  { href: '/shop', label: 'Overview', icon: Home },
  { href: '/shop/products', label: 'Products', icon: Package },
  { href: '/shop/customize', label: 'Customize Shop', icon: Palette },
  { href: '/shop/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/shop/earnings', label: 'Earnings', icon: DollarSign },
  {
    href: '/shop/analytics',
    label: 'Analytics',
    icon: BarChart3,
    badge: 'Pro',
    requiresPro: true,
  },
  { href: '/shop/reviews', label: 'Reviews', icon: Star },
  { href: '/shop/messages', label: 'Messages', icon: MessageSquare },
  { href: '/shop/settings', label: 'Settings', icon: Settings },
]

export function DashboardSidebar({
  user,
  collapsed = false,
  onToggleCollapse,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const isProOrPioneer =
    user?.subscription_tier === 'pro' || user?.subscription_tier === 'pioneer'

  // Fetch unread message count (lightweight endpoint for badge)
  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/messages/unread-count')
        if (response.ok) {
          const data = await response.json()
          setUnreadMessageCount(data.unread_count ?? 0)
        }
      } catch (error) {
        console.error('Error fetching unread message count:', error)
      }
    }

    fetchUnreadCount()
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 bottom-0 z-40 w-64 bg-white border-r transition-all duration-300',
        collapsed && 'w-20'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigationItems.map((item) => {
            const isActive = item.href === '/shop' 
              ? pathname === item.href 
              : pathname === item.href || pathname.startsWith(item.href + '/')
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gray-900 dark:bg-gray-800 text-white border-l-4 border-gray-900 dark:border-gray-700'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white',
                  collapsed && 'justify-center'
                )}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')} />
                {!collapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.href === '/shop/messages' && unreadMessageCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="text-xs"
                      >
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </Badge>
                    )}
                    {item.badge && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-700 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
                {collapsed && item.href === '/shop/messages' && unreadMessageCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="absolute top-1 right-1 size-4 flex items-center justify-center p-0 text-[0.5rem]"
                  >
                    {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                  </Badge>
                )}
              </Link>
            )
          })}
        </nav>
        {/* Upgrade to Pro - visible only for Free tier */}
        {user?.subscription_tier === 'free' && (
          <div className="p-4 border-t">
            <Link
              href="/shop/upgrade"
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                'bg-[#ff7200] text-white hover:bg-[#e66800]',
                collapsed && 'justify-center'
              )}
            >
              <Sparkles className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')} />
              {!collapsed && <span>Upgrade to Pro</span>}
            </Link>
          </div>
        )}
      </div>
    </aside>
  )
}
