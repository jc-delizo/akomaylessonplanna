'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Trash2, ShoppingCart, Heart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { getFullName } from '@/lib/utils/profile'

interface WishlistItem {
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

export default function WishlistPage() {
  const router = useRouter()
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [loading, setLoading] = useState(true)
  const [removing, setRemoving] = useState<string | null>(null)
  const [addingToCart, setAddingToCart] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadWishlist()
  }, [])

  const loadWishlist = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/wishlist')
      if (!response.ok) {
        throw new Error('Failed to load wishlist')
      }

      const data = await response.json()
      setWishlistItems(data.items || [])
    } catch (error) {
      console.error('Error loading wishlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (itemId: string) => {
    setRemoving(itemId)
    try {
      const response = await fetch(`/api/wishlist/${itemId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove item')
      }

      setWishlistItems(items => items.filter(item => item.id !== itemId))
    } catch (error) {
      console.error('Error removing item:', error)
      alert('Failed to remove item. Please try again.')
    } finally {
      setRemoving(null)
    }
  }

  const handleAddToCart = async (productId: string) => {
    setAddingToCart(productId)
    try {
      // Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        // Guest users need to login to use cart
        router.push(`/login?redirect=${encodeURIComponent('/wishlist')}`)
        return
      }

      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_id: productId }),
      })

      if (!response.ok) {
        throw new Error('Failed to add to cart')
      }

      toast.success('Added to cart!')
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart. Please try again.')
    } finally {
      setAddingToCart(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your wishlist...</p>
          </div>
        </div>
      </div>
    )
  }

  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-1">
              My Wishlist
            </h1>
            <p className="text-gray-600">Your wishlist is empty</p>
          </div>
          <Button variant="outline" asChild className="gap-2">
            <Link href="/cart">
              <ShoppingCart className="w-4 h-4" />
              View Cart
            </Link>
          </Button>
        </div>
        <Card className="p-12 text-center">
          <Heart className="w-24 h-24 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2 text-gray-900">Your wishlist is empty</h2>
          <p className="text-gray-600 mb-8">
            Save items you'd like to buy later by clicking the heart icon on any product.
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild size="lg">
              <Link href="/marketplace/browse">Browse Products</Link>
            </Button>
            <Button variant="outline" asChild size="lg" className="gap-2">
              <Link href="/cart">
                <ShoppingCart className="w-4 h-4" />
                View Cart
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
            My Wishlist
          </h1>
          <p className="text-gray-600">
            {wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}
          </p>
        </div>
        <Button variant="outline" asChild className="gap-2">
          <Link href="/cart">
            <ShoppingCart className="w-4 h-4" />
            View Cart
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {wishlistItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col group">
            {/* Product Image */}
            <Link href={`/products/${item.product.id}`} className="relative aspect-[4/3] bg-gray-100 overflow-hidden">
              {item.product.cover_image_url ? (
                <img
                  src={item.product.cover_image_url}
                  alt={item.product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg
                    className="w-16 h-16"
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
            </Link>

            {/* Product Info */}
            <div className="p-5 flex-1 flex flex-col">
              <Link href={`/products/${item.product.id}`}>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-purple-600 transition-colors flex-1 text-gray-900">
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
              <p className="text-xl font-bold text-purple-600 mb-4">
                ₱{item.product.price.toFixed(2)}
              </p>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <Button
                  className="flex-1"
                  onClick={() => handleAddToCart(item.product.id)}
                  disabled={addingToCart === item.product.id}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Add to Cart
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={removing === item.id}
                  className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
