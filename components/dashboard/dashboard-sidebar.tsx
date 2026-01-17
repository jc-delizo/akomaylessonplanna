'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Home,
  Package,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Star,
  MessageSquare,
  Settings,
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

  // Fetch unread message count
  useEffect(() => {
    if (!user) return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/messages/conversations?status=active&per_page=100')
        if (response.ok) {
          const data = await response.json()
          const totalUnread = data.conversations?.reduce(
            (sum: number, conv: any) => sum + (conv.unread_count || 0),
            0
          ) || 0
          setUnreadMessageCount(totalUnread)
        }
      } catch (error) {
        console.error('Error fetching unread message count:', error)
      }
    }

    fetchUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [user])

  return (
    <aside
      className={cn(
        'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r transition-all duration-300',
        collapsed && 'w-20'
      )}
    >
      <div className="flex h-full flex-col">
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {navigationItems.map((item) => {
            // Hide Pro features if user is not Pro/Pioneer
            if (item.requiresPro && !isProOrPioneer) {
              return null
            }

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
                    ? 'bg-orange-50 text-orange-700 border-l-4 border-[#ff7200]'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
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

        {/* User Profile Footer */}
        {user && (
          <div className="border-t p-4">
            <div
              className={cn(
                'flex items-center gap-3',
                collapsed && 'flex-col justify-center'
              )}
            >
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="h-10 w-10 rounded-full"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#ff7200] flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">
                    {user.role || 'Seller'}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
