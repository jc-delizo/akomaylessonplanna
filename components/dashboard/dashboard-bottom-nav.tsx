'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Home, Package, ShoppingBag, DollarSign, User } from 'lucide-react'

const navigationItems = [
  { href: '/shop', label: 'Home', icon: Home },
  { href: '/shop/products', label: 'Products', icon: Package },
  { href: '/shop/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/shop/earnings', label: 'Earnings', icon: DollarSign },
  { href: '/shop/profile', label: 'Profile', icon: User },
]

export function DashboardBottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden">
      <div className="flex items-center justify-around h-16">
        {navigationItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                isActive
                  ? 'text-[#ff7200]'
                  : 'text-gray-500 hover:text-gray-700'
              )}
            >
              <Icon className={cn('h-5 w-5 mb-1', isActive && 'text-[#ff7200]')} />
              <span
                className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-[#ff7200]' : 'text-gray-500'
                )}
              >
                {item.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
