'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { ReviewsSection } from '@/components/reviews/reviews-section'
import { ShareDropdown } from '@/components/social/share-dropdown'
import { RecentlyViewedSidebar } from '@/components/recently-viewed/recently-viewed-sidebar'
import { ProductStats } from '@/components/social-proof/product-stats'
import { ProductBadge } from '@/components/social-proof/product-badge'
import { calculateProductBadgeClient } from '@/lib/social-proof/calculate-badges-client'
import { useGuestCart } from '@/lib/hooks/useGuestCart'
import { MessageSquare, Heart, Star, ShoppingBag } from 'lucide-react'

interface Product {
  id: string
  title: string
  description: string
  price: number
  cover_image_url?: string
  preview_images?: string[]
  product_type: string
  specific_type?: string
  current_version: number
  changelog?: string
  avg_rating?: number
  reviews_count?: number
  sales_count?: number
  views_count?: number
  badges?: string[]
  language?: string
  watermark_enabled: boolean
  created_at: string
  published_at?: string
  seller: {
    id: string
    name: string
    username: string
    avatar_url?: string
    bio?: string
    is_verified_teacher?: boolean
    is_pioneer?: boolean
    subscription_tier?: string
    followers_count?: number
    response_time_hours?: number
  }
  grade: {
    id: string
    name: string
  }
  subject: {
    id: string
    name: string
  }
  quarter?: number
  weeks?: number[]
}

interface ProductDetailLayoutProps {
  product: Product
}

export function ProductDetailLayout({ product }: ProductDetailLayoutProps) {
  const router = useRouter()
  const supabase = createClient()
  const { addItem: addToGuestCart } = useGuestCart()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const [badge, setBadge] = useState<'new' | 'trending' | 'bestseller' | 'popular' | null>(null)

  const images = [
    product.cover_image_url,
    ...(product.preview_images || []),
  ].filter(Boolean) as string[]

  useEffect(() => {
    checkWishlistStatus()
    trackProductView()
    calculateBadge()
  }, [product.id])

  const trackProductView = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Track view (fire and forget)
      fetch(`/api/products/${product.id}/view`, {
        method: 'POST',
      }).catch((err) => {
        console.error('Error tracking view:', err)
      })
    } catch (error) {
      console.error('Error in trackProductView:', error)
    }
  }

  const calculateBadge = () => {
    try {
      const calculatedBadge = calculateProductBadgeClient({
        id: product.id,
        created_at: product.created_at,
        views_count: product.views_count,
        sales_count: product.sales_count,
        wishlist_count: 0, // Would need to fetch this
      })
      setBadge(calculatedBadge)
    } catch (error) {
      console.error('Error calculating badge:', error)
    }
  }

  const checkWishlistStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const response = await fetch(`/api/wishlist?product_id=${product.id}`)
      if (response.ok) {
        const data = await response.json()
        setIsInWishlist(data.isInWishlist || false)
      }
    } catch (error) {
      console.error('Error checking wishlist status:', error)
    }
  }

  const handleAddToCart = async () => {
    try {
      setIsAddingToCart(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Guest user - add to localStorage guest cart
        addToGuestCart(product.id)
        alert('Added to cart!')
        return
      }

      // Authenticated user - add to database cart
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      })

      if (!response.ok) {
        throw new Error('Failed to add to cart')
      }

      // Show success message (could use toast here)
      alert('Added to cart!')
    } catch (error) {
      console.error('Error adding to cart:', error)
      alert('Failed to add to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    try {
      setIsAddingToCart(true)
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Guest user - add to guest cart and redirect to login
        addToGuestCart(product.id)
        router.push(`/login?redirect=${encodeURIComponent(`/checkout?items=${product.id}`)}`)
        return
      }

      // Authenticated user - add to database cart
      const cartResponse = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: product.id }),
      })

      if (!cartResponse.ok) {
        throw new Error('Failed to add to cart')
      }

      const cartData = await cartResponse.json()
      const cartItemId = cartData.item?.id

      // Redirect to checkout with this item
      if (cartItemId) {
        router.push(`/checkout?items=${cartItemId}`)
      } else {
        // Fallback: redirect to cart
        router.push('/cart')
      }
    } catch (error) {
      console.error('Error in buy now:', error)
      alert('Failed to proceed to checkout. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleToggleWishlist = async () => {
    try {
      setIsTogglingWishlist(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch('/api/wishlist', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id }),
        })
        if (response.ok) {
          setIsInWishlist(false)
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: product.id }),
        })
        if (response.ok) {
          setIsInWishlist(true)
        }
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error)
      alert('Failed to update wishlist. Please try again.')
    } finally {
      setIsTogglingWishlist(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatProductType = (productType: string) => {
    // Convert to display format: lesson_plans -> LESSON PLAN (singular)
    let formatted = productType.replace('_', ' ').toUpperCase()
    // Convert plural to singular for lesson plans
    if (productType === 'lesson_plans') {
      formatted = formatted.replace(/S$/, '')
    }
    return formatted
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-600 mb-6">
        <Link href="/marketplace" className="hover:text-purple-600">
          Marketplace
        </Link>
        {' / '}
        <Link href={`/marketplace?grade=${product.grade.id}`} className="hover:text-purple-600">
          {product.grade.name}
        </Link>
        {' / '}
        <Link href={`/marketplace?subject=${product.subject.id}`} className="hover:text-purple-600">
          {product.subject.name}
        </Link>
        {' / '}
        <span className="text-gray-900">{product.title}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
            {images.length > 0 ? (
              <img
                src={images[selectedImageIndex]}
                alt={product.title}
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            )}
          </div>

          {/* Thumbnail Gallery */}
          {images.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-square bg-gray-100 rounded overflow-hidden border-2 ${
                    selectedImageIndex === index
                      ? 'border-purple-600'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {product.watermark_enabled && (
            <p className="text-sm text-gray-500 italic">
              * Preview images contain watermarks. Downloaded files are watermark-free.
            </p>
          )}
        </div>

        {/* Right Column: Product Info */}
        <div className="space-y-4">
          {/* 1. Badges */}
          <div className="flex flex-wrap gap-2">
            {badge && <ProductBadge badge={badge} />}
            {product.badges && product.badges.includes('featured') && (
              <Badge className="bg-purple-600 text-white">FEATURED</Badge>
            )}
            <Badge variant="outline">
              {formatProductType(product.product_type)}
            </Badge>
            {product.specific_type && (
              <Badge variant="outline">
                {product.specific_type.replace('_', ' ').toUpperCase()}
              </Badge>
            )}
          </div>

          {/* 2. Product Name */}
          <h1 className="text-3xl font-bold">{product.title}</h1>

          {/* 3. Metadata as bullets */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">{product.grade.name}</span>
            <span>•</span>
            <span className="font-medium">{product.subject.name}</span>
            {product.quarter && (
              <>
                <span>•</span>
                <span className="font-medium">Quarter {product.quarter}</span>
              </>
            )}
            {product.weeks && product.weeks.length > 0 && (
              <>
                <span>•</span>
                <span className="font-medium">
                  Weeks {product.weeks.join(', ')}
                </span>
              </>
            )}
            <span>•</span>
            <span className="font-medium">v{product.current_version}</span>
          </div>

          {/* 4. Ratings */}
          {product.avg_rating ? (
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold">
                {product.avg_rating.toFixed(1)}
              </span>
            </div>
          ) : (
            <span className="text-gray-600">No reviews yet</span>
          )}

          {/* 5. Price */}
          <p className="text-4xl font-bold text-purple-600">
            ₱{product.price.toFixed(2)}
          </p>

          {/* 6. Sales */}
          {product.sales_count && product.sales_count > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <ShoppingBag className="h-4 w-4" />
              <span>
                {product.sales_count} {product.sales_count === 1 ? 'sale' : 'sales'}
              </span>
            </div>
          )}

          {/* 7. Description */}
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700">{product.description}</p>
          </div>

          {/* 8. Line Separator */}
          <hr className="border-gray-300" />

          {/* 9. Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              className="flex-1 h-10 border-2 border-[#ff7201] text-[#ff7201] bg-transparent hover:bg-[#ff7201]/10"
              onClick={handleBuyNow}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? 'Processing...' : 'Buy Now'}
            </Button>
            <Button 
              className="flex-1 h-10 bg-[#ff7201] hover:bg-[#ff7201]/90 text-white"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
            >
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
            <ShareDropdown
              productId={product.id}
              productTitle={product.title}
            />
            <Button 
              variant="outline" 
              size="icon"
              onClick={handleToggleWishlist}
              disabled={isTogglingWishlist}
              className="h-10 w-10"
            >
              <Heart
                className={`h-4 w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`}
              />
            </Button>
          </div>

          {/* Seller Card */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Seller Information</h3>
            <div className="flex items-start gap-3">
              <Link href={`/sellers/${product.seller.username}`}>
                {product.seller.avatar_url ? (
                  <img
                    src={product.seller.avatar_url}
                    alt={product.seller.name}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-300" />
                )}
              </Link>
              <div className="flex-1">
                <Link
                  href={`/sellers/${product.seller.username}`}
                  className="font-semibold hover:text-purple-600 flex items-center gap-1"
                >
                  {product.seller.name}
                  {product.seller.is_verified_teacher && (
                    <svg
                      className="w-4 h-4 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {product.seller.is_pioneer && (
                    <Badge className="bg-yellow-600 text-white text-xs">
                      PIONEER
                    </Badge>
                  )}
                </Link>
                <p className="text-sm text-gray-600">
                  {product.seller.followers_count || 0} followers
                </p>
                {product.seller.response_time_hours !== undefined &&
                  product.seller.response_time_hours !== null && (
                    <p className="text-sm text-gray-600">
                      Responds in ~{product.seller.response_time_hours}h
                    </p>
                  )}
              </div>
              <Button variant="outline" size="sm">
                Follow
              </Button>
            </div>
            {/* Ask a Question Button */}
            <Link href={`/messages/new?sellerId=${product.seller.id}&productId=${product.id}`} className="mt-4 block">
              <Button variant="outline" className="w-full">
                <MessageSquare className="size-4 mr-2" />
                Ask a Question
              </Button>
            </Link>
          </Card>
        </div>
      </div>

        {/* Additional Sections */}
        <div className="mt-8 space-y-6">

          {/* Recently Viewed Sidebar */}
          <RecentlyViewedSidebar />

        {/* Changelog */}
        {product.changelog && product.current_version > 1 && (
          <Card className="p-6">
            <h2 className="text-2xl font-semibold mb-4">
              What's New in v{product.current_version}
            </h2>
            <p className="text-gray-700 whitespace-pre-wrap">{product.changelog}</p>
          </Card>
        )}

        {/* Meta Information */}
        <Card className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Product Information</h2>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-600 mb-1">Published Date</dt>
              <dd className="font-medium">
                {product.published_at
                  ? formatDate(product.published_at)
                  : formatDate(product.created_at)}
              </dd>
            </div>
            <div>
              <dt className="text-gray-600 mb-1">Last Updated</dt>
              <dd className="font-medium">{formatDate(product.created_at)}</dd>
            </div>
            <div>
              <dt className="text-gray-600 mb-1">Product ID</dt>
              <dd className="font-mono text-xs">{product.id}</dd>
            </div>
            <div>
              <dt className="text-gray-600 mb-1">Current Version</dt>
              <dd className="font-medium">v{product.current_version}</dd>
            </div>
          </dl>
        </Card>

        {/* Reviews Section */}
        <div id="reviews">
          <ReviewsSection
            productId={product.id}
            averageRating={product.avg_rating}
            totalReviews={product.reviews_count}
            showTopN={3}
          />
        </div>
      </div>
    </div>
  )
}
