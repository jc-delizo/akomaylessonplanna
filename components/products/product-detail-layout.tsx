'use client'

import { useState, useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { ReviewsSection } from '@/components/reviews/reviews-section'
import { ShareDropdown } from '@/components/social/share-dropdown'
import { RecentlyViewedSidebar } from '@/components/recently-viewed/recently-viewed-sidebar'
import { ProductBadge } from '@/components/social-proof/product-badge'
import { calculateProductBadgeClient } from '@/lib/social-proof/calculate-badges-client'
import { useGuestCart } from '@/lib/hooks/useGuestCart'
import { BadgeDisplay } from '@/components/profiles/badge-display'
import { getUserBadges, getFullName, getInitials } from '@/lib/utils/profile'
import { FollowButton } from '@/components/profiles/follow-button'
import { Avatar, AvatarImage, AvatarFallback } from '@/registry/default/avatar/avatar'
import { MessageSquare, Heart, Star, ShoppingBag, CheckCircle2, FileText } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/registry/default/dialog/dialog'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

/** Contact Seller: create/find conversation then redirect to /messages/[id] */
function ContactSellerButton({
  sellerId,
  productId,
}: {
  sellerId: string
  productId: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seller_id: sellerId, product_id: productId }),
      })
      if (res.status === 401) {
        router.push(`/login?redirect=${encodeURIComponent(window.location.pathname)}`)
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || 'Failed to start conversation')
        return
      }
      const data = await res.json()
      router.push(`/messages/${data.conversation.id}`)
    } catch (e) {
      toast.error('Failed to start conversation')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant="outline"
      className="h-10"
      onClick={handleClick}
      disabled={loading}
    >
      <MessageSquare className="size-4 mr-2" />
      {loading ? 'Opening...' : 'Chat'}
    </Button>
  )
}

/** Derive display name from file URL (last path segment decoded), strip leading numeric code (digits-), or fallback to File N */
function getFileNameFromUrl(url: string, index: number): string {
  try {
    const segment = url.split('/').filter(Boolean).pop()
    if (segment) {
      let decoded = decodeURIComponent(segment)
      // Remove leading numeric code (e.g. 1769658807736-) used for uniqueness
      decoded = decoded.replace(/^\d+-/, '').trim()
      if (decoded) return decoded
    }
  } catch {
    // ignore decode errors
  }
  return `File ${index + 1}`
}

interface ProductSubjectRow {
  subject_id: string
  subject?: { id: string; name: string; code?: string } | null
  subjects?: { id: string; name: string; code?: string } | null
}

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
  wishlist_count?: number
  computed_badge?: string | null
  badges?: string[]
  language?: string
  curriculum?: string | null
  modalities?: string[] | null
  teaching_framework?: string | null
  watermark_enabled: boolean
  created_at: string
  published_at?: string
  seller: {
    id: string
    first_name: string
    last_name: string
    name?: string
    username: string
    avatar_url?: string
    bio?: string
    is_verified_teacher?: boolean
    is_pioneer?: boolean
    subscription_tier?: string
    followers_count?: number
    response_time_hours?: number
    role?: 'buyer' | 'seller' | 'admin'
    can_sell?: boolean
    avg_rating?: number
    reviews_count?: number
  }
  grade?: { id: string; name: string } | null
  subject?: { id: string; name: string; code?: string } | null
  class_type?: string | null
  strand?: { id: string; name: string; code?: string } | null
  quarter?: number
  weeks?: number[]
  product_subjects?: ProductSubjectRow[] | null
  file_urls?: string[]
}

interface ProductDetailLayoutProps {
  product: Product
  /** Traffic source for analytics: search, marketplace, direct, profile, category, other */
  trafficSource?: string
}

export function ProductDetailLayout({ product, trafficSource }: ProductDetailLayoutProps) {
  const router = useRouter()
  const supabase = createClient()
  const { addItem: addToGuestCart } = useGuestCart()
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [isBuyingNow, setIsBuyingNow] = useState(false)
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false)
  const [badge, setBadge] = useState<'new' | 'trending' | 'bestseller' | 'popular' | null>(null)
  const [filesModalOpen, setFilesModalOpen] = useState(false)
  const [catalogConfig, setCatalogConfig] = useState<{
    productTypes: { slug: string; label: string }[]
    specificTypesByProductType: Record<string, { value: string; label: string }[]>
    curricula: { value: string; label: string }[]
    modalities: { value: string; label: string }[]
    languages: { value: string; label: string }[]
    teachingFrameworks: { value: string; label: string }[]
  } | null>(null)

  useEffect(() => {
    fetch('/api/lesson-plan-config')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data) {
          setCatalogConfig({
            productTypes: data.productTypes ?? [],
            specificTypesByProductType: data.specificTypesByProductType ?? {},
            curricula: data.curricula ?? [],
            modalities: data.modalities ?? [],
            languages: data.languages ?? [],
            teachingFrameworks: data.teachingFrameworks ?? [],
          })
        }
      })
      .catch(() => {})
  }, [])

  const images = [
    product.cover_image_url,
    ...(product.preview_images || []),
  ].filter(Boolean) as string[]

  const validBadges = ['new', 'trending', 'bestseller', 'popular'] as const
  const displayBadge = product.computed_badge && validBadges.includes(product.computed_badge as typeof validBadges[number]) ? product.computed_badge as typeof validBadges[number] : badge

  useEffect(() => {
    checkWishlistStatus()
    trackProductView()
    calculateBadge()
  }, [product.id, product.computed_badge])

  const trackProductView = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Track view (fire and forget) with traffic source for seller analytics
      fetch(`/api/products/${product.id}/view`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: trafficSource || 'direct' }),
      }).catch((err) => {
        console.error('Error tracking view:', err)
      })
    } catch (error) {
      console.error('Error in trackProductView:', error)
    }
  }

  const calculateBadge = () => {
    if (product.computed_badge && validBadges.includes(product.computed_badge as typeof validBadges[number])) {
      setBadge(product.computed_badge as typeof validBadges[number])
      return
    }
    try {
      const calculatedBadge = calculateProductBadgeClient({
        id: product.id,
        created_at: product.created_at,
        views_count: product.views_count,
        sales_count: product.sales_count,
        wishlist_count: product.wishlist_count ?? 0,
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
        toast.success('Added to cart!')
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

      // Show success message
      toast.success('Added to cart!')
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart. Please try again.')
    } finally {
      setIsAddingToCart(false)
    }
  }

  const handleBuyNow = async () => {
    try {
      setIsBuyingNow(true)
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
      toast.error('Failed to proceed to checkout. Please try again.')
    } finally {
      setIsBuyingNow(false)
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
      toast.error('Failed to update wishlist. Please try again.')
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

  const getProductTypeLabel = (productType: string) =>
    catalogConfig?.productTypes.find((pt) => pt.slug === productType)?.label ??
    productType.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())

  const getSpecificTypeLabel = (value: string) => {
    const specificTypes = catalogConfig?.specificTypesByProductType[product.product_type] ?? []
    return specificTypes.find((s) => s.value === value)?.label ?? value.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())
  }

  const getLanguageLabel = (value: string | null | undefined) =>
    !value ? null : (catalogConfig?.languages.find((l) => l.value === value)?.label ?? value.replace(/_/g, ' '))

  const getCurriculumLabel = (value: string | null | undefined) =>
    !value ? null : (catalogConfig?.curricula.find((c) => c.value === value)?.label ?? value.replace(/_/g, ' '))

  const getModalityLabel = (value: string | null | undefined) =>
    !value ? null : (catalogConfig?.modalities.find((m) => m.value === value)?.label ?? value.replace(/_/g, ' '))

  const getTeachingFrameworkLabel = (value: string | null | undefined) =>
    !value ? null : (catalogConfig?.teachingFrameworks.find((t) => t.value === value)?.label ?? value.replace(/_/g, ' '))

  return (
    <div className="container mx-auto px-4 py-8">
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
          {/* Product Name + social-proof badges beside title */}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-3xl font-bold">{product.title}</h1>
            {displayBadge && <ProductBadge badge={displayBadge} />}
            {product.badges && product.badges.includes('featured') && (
              <Badge className="bg-purple-600 text-white">FEATURED</Badge>
            )}
          </div>

          {/* Grouped attribute badges: one row per group */}
          <div className="space-y-3">
            {(() => {
              const subjectNames = new Set<string>()
              if (product.subject?.name) subjectNames.add(product.subject.name)
              product.product_subjects?.forEach((ps) => {
                const sub = ps.subject ?? ps.subjects
                if (sub?.name) subjectNames.add(sub.name)
              })
              const subjectsList = Array.from(subjectNames)
              const hasGradeOrSubjects = !!product.grade?.name || subjectsList.length > 0
              const hasPeriod = product.quarter != null || (product.weeks && product.weeks.length > 0)
              const hasModality = product.modalities && product.modalities.length > 0
              const groups: { label: string; content: ReactNode }[] = []
              // Product: Product Type, Specific Type
              groups.push({
                label: 'Product',
                content: (
                  <>
                    <Badge variant="outline">{getProductTypeLabel(product.product_type)}</Badge>
                    {product.specific_type && (
                      <Badge variant="outline">
                        {getSpecificTypeLabel(product.specific_type)}
                      </Badge>
                    )}
                  </>
                ),
              })
              // Grade & Subjects
              if (hasGradeOrSubjects) {
                groups.push({
                  label: 'Grade & Subjects',
                  content: (
                    <>
                      {product.grade?.name && (
                        <Badge variant="outline">{product.grade.name}</Badge>
                      )}
                      {subjectsList.map((name) => (
                        <Badge key={name} variant="outline">
                          {name}
                        </Badge>
                      ))}
                    </>
                  ),
                })
              }
              // Period: Quarter, Weeks
              if (hasPeriod) {
                groups.push({
                  label: 'Period',
                  content: (
                    <>
                      {product.quarter != null && (
                        <Badge variant="outline">Quarter {product.quarter}</Badge>
                      )}
                      {product.weeks && product.weeks.length > 0 && (
                        <Badge variant="outline">
                          Weeks {[...product.weeks].sort((a, b) => a - b).join(', ')}
                        </Badge>
                      )}
                    </>
                  ),
                })
              }
              // Language
              if (product.language) {
                groups.push({
                  label: 'Language',
                  content: (
                    <Badge variant="outline">
                      {getLanguageLabel(product.language) ?? product.language}
                    </Badge>
                  ),
                })
              }
              // Curriculum
              if (product.curriculum) {
                groups.push({
                  label: 'Curriculum',
                  content: (
                    <Badge variant="outline">
                      {getCurriculumLabel(product.curriculum) ?? product.curriculum}
                    </Badge>
                  ),
                })
              }
              // Modality
              if (hasModality) {
                groups.push({
                  label: 'Modality',
                  content: (
                    <>
                      {product.modalities?.map((m) => (
                        <Badge key={m} variant="outline">
                          {getModalityLabel(m) ?? m}
                        </Badge>
                      ))}
                    </>
                  ),
                })
              }
              // Teaching Framework
              if (product.teaching_framework) {
                groups.push({
                  label: 'Teaching Framework',
                  content: (
                    <Badge variant="outline">
                      {getTeachingFrameworkLabel(product.teaching_framework) ?? product.teaching_framework}
                    </Badge>
                  ),
                })
              }
              return groups.map((g) => (
                <div key={g.label} className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground font-medium shrink-0 w-32">{g.label}</span>
                  <span className="flex items-center gap-1.5 flex-wrap">{g.content}</span>
                </div>
              ))
            })()}
          </div>

          {/* Ratings — only show when there are reviews */}
          {(product.reviews_count ?? 0) > 0 && product.avg_rating != null && (
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <span className="font-semibold">
                {product.avg_rating.toFixed(1)}
              </span>
            </div>
          )}

          {/* 5. Price */}
          <p className="text-4xl font-bold text-purple-600">
            ₱{product.price.toFixed(2)}
          </p>

          {/* 6. Sales — only show when there are sales */}
          {(product.sales_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <ShoppingBag className="h-4 w-4" />
              <span>
                {product.sales_count} {product.sales_count === 1 ? 'sale' : 'sales'}
              </span>
            </div>
          )}

          {/* 6b. Wishlist count — when cron has populated wishlist_count */}
          {(product.wishlist_count ?? 0) > 0 && (
            <div className="flex items-center gap-1 text-sm text-gray-600">
              <Heart className="h-4 w-4" />
              <span>
                {product.wishlist_count} {product.wishlist_count === 1 ? 'person' : 'people'} wishlisted
              </span>
            </div>
          )}

          {/* 7. Description */}
          <div className="prose max-w-none">
            <p className="whitespace-pre-wrap text-gray-700">{product.description}</p>
          </div>

          {/* See files button */}
          {product.file_urls && product.file_urls.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilesModalOpen(true)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              See files
            </Button>
          )}

          {/* Files modal */}
          <Dialog open={filesModalOpen} onOpenChange={setFilesModalOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Product files</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                {product.file_urls?.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                  >
                    <FileText className="h-5 w-5 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{getFileNameFromUrl(url, index)}</span>
                    <span className="ml-auto text-muted-foreground">{index + 1}</span>
                  </div>
                ))}
              </div>
            </DialogContent>
          </Dialog>

          {/* 8. Line Separator */}
          <hr className="border-gray-300" />

          {/* 9. Action Buttons */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              className="flex-1 h-10 border-2 border-[#ff7201] text-[#ff7201] bg-transparent hover:bg-[#ff7201]/10"
              onClick={handleBuyNow}
              disabled={isBuyingNow || isAddingToCart}
            >
              {isBuyingNow ? 'Processing...' : 'Buy Now'}
            </Button>
            <Button 
              className="flex-1 h-10 bg-[#ff7201] hover:bg-[#ff7201]/90 text-white"
              onClick={handleAddToCart}
              disabled={isAddingToCart || isBuyingNow}
            >
              {isAddingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>
            <ShareDropdown
              productId={product.id}
              productTitle={product.title}
            />
            <Tooltip>
              <TooltipTrigger asChild>
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
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to Wishlist</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Seller Card */}
          <Card className="p-5">
            <h3 className="font-semibold text-lg mb-4">Seller Information</h3>
            
            {/* Seller Profile Section - Horizontal Layout */}
            <div className="flex items-start justify-between gap-4">
              {/* Left Side: Seller Info */}
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <Link href={`/sellers/${product.seller.username}`} className="shrink-0">
                  <Avatar className="h-12 w-12">
                    {product.seller.avatar_url ? (
                      <AvatarImage src={product.seller.avatar_url} alt={getFullName(product.seller)} />
                    ) : null}
                    <AvatarFallback>
                      {getInitials(product.seller.first_name || '', product.seller.last_name || '')}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  {/* Seller Name with Verified Icon */}
                  <Link
                    href={`/sellers/${product.seller.username}`}
                    className="flex items-center gap-2 hover:text-purple-600 transition-colors mb-1"
                  >
                    {product.seller.is_verified_teacher && (
                      <CheckCircle2 className="h-5 w-5 text-blue-600 shrink-0" fill="currentColor" />
                    )}
                    <span className="text-xl font-bold">{getFullName(product.seller)}</span>
                  </Link>
                  
                  {/* Username */}
                  {product.seller.username && (
                    <p className="text-sm text-muted-foreground mb-2">@{product.seller.username}</p>
                  )}
                  
                  {/* Ratings and Response Time */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2 flex-wrap">
                    {product.seller.avg_rating !== undefined && product.seller.avg_rating !== null && (
                      <>
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{product.seller.avg_rating.toFixed(1)}</span>
                          {product.seller.reviews_count !== undefined && product.seller.reviews_count !== null && (
                            <span>({product.seller.reviews_count} {product.seller.reviews_count === 1 ? 'review' : 'reviews'})</span>
                          )}
                        </div>
                        {product.seller.response_time_hours !== undefined &&
                          product.seller.response_time_hours !== null && (
                            <span>•</span>
                          )}
                      </>
                    )}
                    {product.seller.response_time_hours !== undefined &&
                      product.seller.response_time_hours !== null && (
                        <span>Responds in ~{product.seller.response_time_hours}h</span>
                      )}
                  </div>
                  
                  {/* Badges */}
                  {(() => {
                    const sellerForBadges = {
                      ...product.seller,
                      role: product.seller.role || 'seller',
                      can_sell: product.seller.can_sell ?? true,
                    }
                    const badges = getUserBadges(sellerForBadges as any)
                    return badges.length > 0 ? <BadgeDisplay badges={badges} className="mb-2" /> : null
                  })()}
                  
                  {/* Followers Count */}
                  <p className="text-sm text-muted-foreground">
                    {product.seller.followers_count || 0} {product.seller.followers_count === 1 ? 'follower' : 'followers'}
                  </p>
                </div>
              </div>

              {/* Right Side: Action Buttons */}
              <div className="flex items-center gap-2 shrink-0">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <ContactSellerButton
                      sellerId={product.seller.id}
                      productId={product.id}
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Ask the seller about this product</p>
                  </TooltipContent>
                </Tooltip>
                <FollowButton
                  username={product.seller.username}
                  initialFollowersCount={product.seller.followers_count || 0}
                  hideFollowerCount={true}
                  buttonClassName="h-10"
                />
              </div>
            </div>
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
