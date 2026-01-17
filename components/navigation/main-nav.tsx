'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { SearchBar } from '@/components/search/search-bar'
import { MessageSquare, Shield, User, LogOut, ShoppingCart } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { GlareButton } from '@/components/ui/glare-button'
import { useAdminAuth } from '@/lib/hooks/useAdminAuth'
import { useGuestCart } from '@/lib/hooks/useGuestCart'
import { createClient } from '@/lib/supabase/client'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MainNavProps {
  user?: {
    id: string
    email?: string
    name?: string
  } | null
}

const PROFILE_CACHE_PREFIX = 'supabase.user.profile.'

type UserProfile = {
  avatar_url?: string | null
  name: string
  email?: string
  role?: 'buyer' | 'seller' | 'admin'
  can_sell?: boolean
}

// Cache helper functions for user profile
function getCachedUserProfile(userId: string): UserProfile | null {
  if (typeof window === 'undefined') return null
  try {
    const cached = localStorage.getItem(`${PROFILE_CACHE_PREFIX}${userId}`)
    if (!cached) return null
    return JSON.parse(cached) as UserProfile
  } catch (error) {
    // Handle localStorage errors (private browsing, etc.)
    console.warn('Failed to read cached user profile:', error)
    return null
  }
}

function setCachedUserProfile(userId: string, profile: UserProfile): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(`${PROFILE_CACHE_PREFIX}${userId}`, JSON.stringify(profile))
  } catch (error) {
    // Handle localStorage errors gracefully
    console.warn('Failed to cache user profile:', error)
  }
}

function clearCachedUserProfile(userId: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(`${PROFILE_CACHE_PREFIX}${userId}`)
  } catch (error) {
    console.warn('Failed to clear cached user profile:', error)
  }
}

export function MainNav({ user }: MainNavProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [cartItemCount, setCartItemCount] = useState(0)
  const [mounted, setMounted] = useState(false)
  // Initialize userProfile from cache synchronously for instant rendering
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    if (user && typeof window !== 'undefined') {
      return getCachedUserProfile(user.id)
    }
    return null
  })
  const { isAdmin, loading: adminLoading } = useAdminAuth()
  const { cartCount: guestCartCount } = useGuestCart()
  
  // #region agent log - Debug hydration mismatch
  useEffect(() => {
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main-nav.tsx:88',message:'MainNav render - user state',data:{hasUser:!!user,userId:user?.id,mounted,isAdmin,adminLoading,isClient:typeof window !== 'undefined',willRenderUserLinks:mounted && !!user},timestamp:Date.now(),sessionId:'debug-session',runId:'hydration-debug',hypothesisId:'A'})}).catch(()=>{});
  }, [user, mounted, isAdmin, adminLoading]);
  // #endregion
  
  // Track mount state to prevent hydration mismatches
  useEffect(() => {
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'main-nav.tsx:95',message:'MainNav mounted',data:{hasUser:!!user,userId:user?.id},timestamp:Date.now(),sessionId:'debug-session',runId:'hydration-debug',hypothesisId:'B'})}).catch(()=>{});
    setMounted(true)
  }, [])
  
  // Removed agent log fetch to prevent ERR_INSUFFICIENT_RESOURCES errors

  // Fetch user profile data
  useEffect(() => {
    if (!user) {
      setUserProfile(null)
      return
    }

    // Load cached profile immediately if available
    const cachedProfile = getCachedUserProfile(user.id)
    if (cachedProfile) {
      setUserProfile(cachedProfile)
    }

    let cancelled = false

    const fetchUserProfile = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('users')
          .select('id, name, email, avatar_url, role, can_sell')
          .eq('id', user.id)
          .single()

        if (cancelled) return

        if (error) throw error
        if (data) {
          const profileData: UserProfile = {
            avatar_url: data.avatar_url,
            name: data.name || user.name || 'User',
            email: data.email || user.email,
            role: data.role,
            can_sell: data.can_sell,
          }
          
          // Cache the fetched profile
          setCachedUserProfile(user.id, profileData)
          if (!cancelled) {
            setUserProfile(profileData)
          }
        }
      } catch (error) {
        if (cancelled) return
        console.error('Error fetching user profile:', error)
        // Fallback to cached profile or basic user info
        const fallbackProfile: UserProfile = cachedProfile || {
          avatar_url: null,
          name: user.name || 'User',
          email: user.email,
        }
        if (!cancelled) {
          setUserProfile(fallbackProfile)
        }
      }
    }

    fetchUserProfile()

    return () => {
      cancelled = true
    }
  }, [user])

  // Fetch unread message count
  useEffect(() => {
    if (!user) {
      setUnreadMessageCount(0)
      return
    }

    let cancelled = false
    let abortController: AbortController | null = null

    const fetchUnreadCount = async () => {
      if (cancelled) return

      // Cancel previous request if still pending
      if (abortController) {
        abortController.abort()
      }
      abortController = new AbortController()

      try {
        const response = await fetch('/api/messages/conversations?status=active&per_page=1', {
          signal: abortController.signal,
        })
        
        if (cancelled) return

        if (response.ok) {
          const data = await response.json()
          // Calculate total unread from conversations
          const totalUnread = data.conversations?.reduce(
            (sum: number, conv: any) => sum + (conv.unread_count || 0),
            0
          ) || 0
          if (!cancelled) {
            setUnreadMessageCount(totalUnread)
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, ignore
          return
        }
        if (!cancelled) {
          console.error('Error fetching unread message count:', error)
        }
      }
    }

    fetchUnreadCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    
    return () => {
      cancelled = true
      clearInterval(interval)
      if (abortController) {
        abortController.abort()
      }
    }
  }, [user])

  // Fetch cart item count (only for authenticated users)
  useEffect(() => {
    if (!user) {
      // For guests, cart count comes from useGuestCart hook
      setCartItemCount(0)
      return
    }

    let cancelled = false
    let abortController: AbortController | null = null

    const fetchCartCount = async () => {
      if (cancelled) return

      // Cancel previous request if still pending
      if (abortController) {
        abortController.abort()
      }
      abortController = new AbortController()

      try {
        const response = await fetch('/api/cart', {
          signal: abortController.signal,
        })
        
        if (cancelled) return

        if (response.ok) {
          const data = await response.json()
          const count = data.items?.length || 0
          if (!cancelled) {
            setCartItemCount(count)
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          // Request was cancelled, ignore
          return
        }
        if (!cancelled) {
          console.error('Error fetching cart count:', error)
        }
      }
    }

    fetchCartCount()
    // Poll every 30 seconds
    const interval = setInterval(fetchCartCount, 30000)
    
    return () => {
      cancelled = true
      clearInterval(interval)
      if (abortController) {
        abortController.abort()
      }
    }
  }, [user])

  // Calculate total cart count (guest or authenticated)
  const totalCartCount = user ? cartItemCount : guestCartCount

  const handleLogout = async () => {
    const supabase = createClient()
    
    // Clear cached profile on logout
    if (user) {
      clearCachedUserProfile(user.id)
    }
    
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const isActive = (path: string) => {
    if (path === '/') return pathname === path
    return pathname.startsWith(path)
  }

  return (
    <nav className="bg-white border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/android-chrome-192x192.png"
              alt="Akomay Lesson Planna Logo"
              width={32}
              height={32}
              className="w-8 h-8"
              priority
            />
            <span className="font-bold text-xl hidden sm:block">ako may lesson plan na!</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6 flex-1 max-w-2xl mx-4">
            <SearchBar 
              placeholder="Search lesson plans..."
              className="flex-1"
            />
          </div>
          <div className="hidden md:flex items-center gap-5">
            <Link
              href="/marketplace"
              className={`text-sm font-medium transition-colors hover:text-orange-600 ${
                (pathname === '/marketplace' || (pathname.startsWith('/marketplace/') && !pathname.startsWith('/marketplace/browse'))) ? 'text-orange-600' : 'text-gray-700'
              }`}
            >
              Marketplace
            </Link>
            <Link
              href="/marketplace/browse"
              className={`text-sm font-medium transition-colors hover:text-orange-600 ${
                isActive('/marketplace/browse') ? 'text-orange-600' : 'text-gray-700'
              }`}
            >
              Browse
            </Link>
            {/* Only render user-dependent links after mount to prevent hydration mismatch */}
            <div suppressHydrationWarning>
              {mounted && user && (
                <>
                  {(userProfile?.role === 'seller' || userProfile?.role === 'admin' || userProfile?.can_sell === true) && (
                    <Link
                      href="/shop/products"
                      className={`text-sm font-medium transition-colors hover:text-orange-600 ${
                        isActive('/shop/products') ? 'text-orange-600' : 'text-gray-700'
                      }`}
                    >
                      My Shop
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Right Side Actions */}
          <div className="hidden md:flex items-center gap-3" suppressHydrationWarning>
            {/* Only render user-dependent content after mount to prevent hydration mismatch */}
            {mounted && user ? (
              <>
                <GlareButton>
                  <Link
                    href={userProfile?.role === 'buyer' || userProfile?.can_sell === false
                      ? '/become-seller'
                      : '/shop/products/new'}
                    className="px-4 py-2 h-9 flex items-center bg-[#ff7200] text-white rounded-lg hover:bg-[#e66500] transition-colors text-sm font-medium whitespace-nowrap"
                  >
                    {userProfile?.role === 'buyer' || userProfile?.can_sell === false
                      ? 'Be a Seller'
                      : 'Upload Product'}
                  </Link>
                </GlareButton>
                <Link
                  href="/messages"
                  className="relative flex items-center justify-center h-9 w-9 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Messages"
                >
                  <MessageSquare className="size-5" />
                  {unreadMessageCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </Badge>
                  )}
                </Link>
                <NotificationBell />
                <Link
                  href="/cart"
                  className="relative flex items-center justify-center h-9 w-9 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="size-5" />
                  {totalCartCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 size-5 flex items-center justify-center p-0 text-xs"
                    >
                      {totalCartCount > 9 ? '9+' : totalCartCount}
                    </Badge>
                  )}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/dashboard"
                    className={`relative flex items-center justify-center h-9 w-9 hover:bg-gray-100 rounded-lg transition-colors ${
                      isActive('/admin') ? 'bg-gray-100' : ''
                    }`}
                    title="Admin Panel"
                  >
                    <Shield className={`size-5 ${isActive('/admin') ? 'text-orange-600' : ''}`} />
                  </Link>
                )}
                {userProfile && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center justify-center h-9 w-9 rounded-full hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                        aria-label="User menu"
                      >
                        {userProfile.avatar_url ? (
                          <Image
                            src={userProfile.avatar_url}
                            alt={userProfile.name}
                            width={36}
                            height={36}
                            className="h-9 w-9 rounded-full object-cover"
                          />
                        ) : (
                          <div className="h-9 w-9 rounded-full bg-[#ff7200] flex items-center justify-center text-white font-semibold text-sm">
                            {userProfile.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">{userProfile.name}</p>
                          {userProfile.email && (
                            <p className="text-xs leading-none text-muted-foreground">
                              {userProfile.email}
                            </p>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href="/profile/edit" className="cursor-pointer flex items-center">
                          <User className="mr-2 h-4 w-4" />
                          View Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </>
            ) : mounted && !user ? (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-4 py-2 h-9 flex items-center bg-[#ff7200] text-white rounded-lg hover:bg-[#e66500] transition-colors text-sm font-medium whitespace-nowrap"
                >
                  Sign Up
                </Link>
              </>
            ) : null}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

          {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col gap-3">
              {/* Mobile Search Bar */}
              <div className="px-2">
                <SearchBar 
                  placeholder="Search lesson plans..."
                />
              </div>
              <Link
                href="/marketplace"
                className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link
                href="/marketplace/browse"
                className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Browse
              </Link>
              {/* Only render user-dependent links after mount to prevent hydration mismatch */}
              <div suppressHydrationWarning>
                {mounted && user && (
                  <>
                    {/* Only render admin link after mount to prevent hydration mismatch */}
                    {isAdmin && (
                      <Link
                        href="/admin/dashboard"
                        className={`flex items-center justify-center h-9 w-9 hover:bg-gray-100 rounded-lg transition-colors ${
                          isActive('/admin') ? 'bg-gray-100' : ''
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                        title="Admin Panel"
                      >
                        <Shield className={`size-5 ${isActive('/admin') ? 'text-orange-600' : ''}`} />
                      </Link>
                    )}
                  <Link
                    href="/messages"
                    className="text-sm font-medium text-gray-700 hover:text-orange-600 flex items-center gap-2 py-2 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageSquare className="size-4" />
                    Messages
                    {unreadMessageCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </Badge>
                    )}
                  </Link>
                  <Link
                    href="/cart"
                    className="text-sm font-medium text-gray-700 hover:text-orange-600 flex items-center gap-2 py-2 transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingCart className="size-4" />
                    Shopping Cart
                    {totalCartCount > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {totalCartCount > 9 ? '9+' : totalCartCount}
                      </Badge>
                    )}
                  </Link>
                  {(userProfile?.role === 'seller' || userProfile?.role === 'admin' || userProfile?.can_sell === true) && (
                    <Link
                      href="/shop/products"
                      className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors py-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      My Shop
                    </Link>
                  )}
                  <Link
                    href="/profile/edit"
                    className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Profile
                  </Link>
                  <GlareButton>
                    <Link
                      href="/shop/products/new"
                      className="px-4 py-2 bg-[#ff7200] text-white rounded-lg hover:bg-[#e66500] text-sm font-medium text-center transition-colors mt-2"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {userProfile?.role === 'buyer' || userProfile?.can_sell === false
                        ? 'Be a Seller'
                        : 'Upload Product'}
                    </Link>
                  </GlareButton>
                </>
              )}
              {mounted && !user && (
                <>
                  <Link
                    href="/login"
                    className="text-sm font-medium text-gray-700 hover:text-orange-600 transition-colors py-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-2 bg-[#ff7200] text-white rounded-lg hover:bg-[#e66500] text-sm font-medium text-center transition-colors mt-2"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
