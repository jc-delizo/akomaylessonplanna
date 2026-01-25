'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import Link from 'next/link'
import { Trash2, Heart, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useGuestCart } from '@/lib/hooks/useGuestCart'
import { getGuestCartProductIds, clearGuestCart } from '@/lib/utils/guest-cart'
import { toast } from 'sonner'
import { getFullName } from '@/lib/utils/profile'

interface CartItem {
  id: string
  product_id: string
  created_at: string
  product: {
    id: string
    title: string
    price: number
    cover_image_url?: string
    seller: {
      id: string
      first_name: string
      last_name: string
      name?: string // For backward compatibility
      username: string
    }
  }
}

interface GuestCartItem {
  id: string // product_id used as id for guest items
  product_id: string
  created_at: string
  product: {
    id: string
    title: string
    price: number
    cover_image_url?: string
    seller: {
      id: string
      first_name: string
      last_name: string
      name?: string // For backward compatibility
      username: string
    }
  }
}

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<(CartItem | GuestCartItem)[]>([])
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [isGuest, setIsGuest] = useState(false)
  const supabase = createClient()
  const { removeItem: removeGuestItem, clearCart: clearGuestCart } = useGuestCart()

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Guest cart - load from localStorage
        setIsGuest(true)
        const productIds = getGuestCartProductIds()
        
        if (productIds.length === 0) {
          setCartItems([])
          setLoading(false)
          return
        }

        // Fetch product details for guest cart
        const response = await fetch('/api/cart/guest-products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productIds }),
        })

        if (!response.ok) {
          throw new Error('Failed to load guest cart products')
        }

        const data = await response.json()
        const products = data.products || []

        // Convert to cart item format
        const guestCartItems: GuestCartItem[] = products.map((product: any) => ({
          id: product.id, // Use product_id as id for guest items
          product_id: product.id,
          created_at: new Date().toISOString(),
          product: {
            id: product.id,
            title: product.title,
            price: product.price,
            cover_image_url: product.cover_image_url,
            seller: product.seller,
          },
        }))

        setCartItems(guestCartItems)
      } else {
        // Authenticated user - load from database
        setIsGuest(false)
        
        // Check for guest cart and merge it
        const guestCartProductIds = getGuestCartProductIds()
        if (guestCartProductIds.length > 0) {
          try {
            const mergeResponse = await fetch('/api/cart/merge-guest', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ productIds: guestCartProductIds }),
            })
            
            if (mergeResponse.ok) {
              // Clear guest cart after successful merge
              clearGuestCart()
            }
          } catch (mergeError) {
            console.error('Error merging guest cart:', mergeError)
            // Continue loading cart even if merge fails
          }
        }
        
        const response = await fetch('/api/cart')
        if (!response.ok) {
          throw new Error('Failed to load cart')
        }

        const data = await response.json()
        setCartItems(data.items || [])
      }
    } catch (error) {
      console.error('Error loading cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectAll = () => {
    if (selectedItems.size === cartItems.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(cartItems.map(item => item.id)))
    }
  }

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems)
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId)
    } else {
      newSelected.add(itemId)
    }
    setSelectedItems(newSelected)
  }

  const handleRemoveItem = async (itemId: string) => {
    setRemoving(itemId)
    try {
      if (isGuest) {
        // Remove from localStorage guest cart
        removeGuestItem(itemId)
        setCartItems(items => items.filter(item => item.id !== itemId))
        setSelectedItems(selected => {
          const newSelected = new Set(selected)
          newSelected.delete(itemId)
          return newSelected
        })
      } else {
        // Remove from database cart
        const response = await fetch(`/api/cart/${itemId}`, {
          method: 'DELETE',
        })

        if (!response.ok) {
          throw new Error('Failed to remove item')
        }

        setCartItems(items => items.filter(item => item.id !== itemId))
        setSelectedItems(selected => {
          const newSelected = new Set(selected)
          newSelected.delete(itemId)
          return newSelected
        })
      }
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item. Please try again.')
    } finally {
      setRemoving(null)
    }
  }

  const handleRemoveSelected = async () => {
    if (selectedItems.size === 0) return

    try {
      const itemIds = Array.from(selectedItems)
      
      if (isGuest) {
        // Remove from localStorage guest cart
        itemIds.forEach(id => removeGuestItem(id))
        setCartItems(items => items.filter(item => !selectedItems.has(item.id)))
        setSelectedItems(new Set())
      } else {
        // Remove from database cart
        for (const itemId of itemIds) {
          const response = await fetch(`/api/cart/${itemId}`, {
            method: 'DELETE',
          })
          if (!response.ok) {
            throw new Error('Failed to remove item')
          }
        }

        setCartItems(items => items.filter(item => !selectedItems.has(item.id)))
        setSelectedItems(new Set())
      }
    } catch (error) {
      console.error('Error removing items:', error)
      alert('Failed to remove items. Please try again.')
    }
  }

  const handleMoveToWishlist = async (itemId: string, productId: string) => {
    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Guest users need to login to use wishlist
      router.push(`/login?redirect=${encodeURIComponent('/cart')}`)
      return
    }

    try {
      const response = await fetch('/api/wishlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      })

      if (!response.ok) {
        throw new Error('Failed to add to wishlist')
      }

      toast.success('Added to wishlist!')
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      toast.error('Failed to add to wishlist. Please try again.')
    }
  }

  const handleCheckout = async () => {
    if (selectedItems.size === 0) {
      alert('Please select at least one item to checkout')
      return
    }

    // Check if user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // Guest users need to login before checkout
      const returnUrl = `/checkout?items=${Array.from(selectedItems).join(',')}`
      router.push(`/login?redirect=${encodeURIComponent(returnUrl)}`)
      return
    }

    const itemIds = Array.from(selectedItems)
    router.push(`/checkout?items=${itemIds.join(',')}`)
  }

  const subtotal = cartItems
    .filter(item => selectedItems.has(item.id))
    .reduce((sum, item) => sum + item.product.price, 0)

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your cart...</p>
          </div>
        </div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              Shopping Cart
            </h1>
            <p className="text-gray-600">Your cart is empty</p>
          </div>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/wishlist">
              <Heart className="w-4 h-4" />
              View Wishlist
            </Link>
          </Button>
        </div>
        <Card className="p-12 text-center">
          <ShoppingCart className="w-24 h-24 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">Your cart is empty</h2>
          <p className="text-gray-600 mb-8">
            Start adding products to your cart to get started!
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/marketplace/browse">Browse Products</Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="gap-2">
              <Link href="/wishlist">
                <Heart className="w-4 h-4" />
                View Wishlist
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header Section */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Shopping Cart
          </h1>
          <p className="text-gray-600">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/wishlist">
            <Heart className="w-4 h-4" />
            View Wishlist
          </Link>
        </Button>
      </div>

      {/* Bulk Actions */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedItems.size === cartItems.length && cartItems.length > 0}
            onCheckedChange={handleSelectAll}
            id="select-all"
          />
          <label htmlFor="select-all" className="text-sm font-medium cursor-pointer text-gray-700">
            Select All
          </label>
        </div>
        {selectedItems.size > 0 && (
          <>
            <span className="text-gray-300">|</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedItems(new Set())}
              className="h-8 text-sm"
            >
              Deselect
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveSelected}
              className="h-8 text-sm text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              Remove ({selectedItems.size})
            </Button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2 space-y-3">
          {cartItems.map((item) => (
            <Card key={item.id} className="p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex gap-5">
                {/* Checkbox */}
                <div className="flex items-start pt-1">
                  <Checkbox
                    checked={selectedItems.has(item.id)}
                    onCheckedChange={() => handleToggleItem(item.id)}
                    id={`item-${item.id}`}
                  />
                </div>

                {/* Product Image */}
                <Link href={`/products/${item.product.id}`} className="flex-shrink-0 group">
                  <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border border-gray-200 group-hover:border-purple-300 transition-colors">
                    {item.product.cover_image_url ? (
                      <img
                        src={item.product.cover_image_url}
                        alt={item.product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg
                          className="w-10 h-10"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
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
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product.id}`}>
                    <h3 className="font-semibold text-lg mb-2 hover:text-purple-600 transition-colors line-clamp-2">
                      {item.product.title}
                    </h3>
                  </Link>
                  <p className="text-sm text-gray-600 mb-3">
                    Seller:{' '}
                    <Link
                      href={`/sellers/${item.product.seller.username}`}
                      className="hover:text-purple-600 transition-colors font-medium"
                    >
                      {getFullName(item.product.seller)}
                    </Link>
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    ₱{item.product.price.toFixed(2)}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 items-end">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleMoveToWishlist(item.id, item.product.id)}
                    className="h-9 w-9 text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                    title="Add to Wishlist"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={removing === item.id}
                    className="h-9 w-9 text-gray-600 hover:text-red-600 hover:bg-red-50"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 sticky top-4 shadow-sm">
            <h2 className="text-xl font-semibold mb-6 text-gray-900">Order Summary</h2>
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Items ({selectedItems.size})</span>
                <span className="font-medium">₱{subtotal.toFixed(2)}</span>
              </div>
              <div className="border-t border-gray-200 pt-4">
                <div className="flex justify-between text-lg font-bold">
                  <span className="text-gray-900">Total</span>
                  <span className="text-purple-600">₱{subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {isGuest ? (
              <Button
                className="w-full mb-3"
                size="lg"
                onClick={handleCheckout}
                disabled={selectedItems.size === 0}
              >
                Sign in to Checkout {selectedItems.size > 0 && `(${selectedItems.size} ${selectedItems.size === 1 ? 'item' : 'items'})`}
              </Button>
            ) : (
              <Button
                className="w-full mb-3"
                size="lg"
                onClick={handleCheckout}
                disabled={selectedItems.size === 0}
              >
                Checkout {selectedItems.size > 0 && `(${selectedItems.size} ${selectedItems.size === 1 ? 'item' : 'items'})`}
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full mb-3"
              asChild
            >
              <Link href="/marketplace">Continue Shopping</Link>
            </Button>
            <Button
              variant="outline"
              className="w-full gap-2"
              asChild
            >
              <Link href="/wishlist">
                <Heart className="w-4 h-4" />
                View Wishlist
              </Link>
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
