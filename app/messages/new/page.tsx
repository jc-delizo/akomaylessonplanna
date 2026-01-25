'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import Image from 'next/image'
import { ArrowLeft, Search } from 'lucide-react'
import { getFullName, getInitials } from '@/lib/utils/profile'

export default function NewMessagePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [sellerId, setSellerId] = useState<string | null>(
    searchParams.get('sellerId') || null
  )
  const [productId, setProductId] = useState<string | null>(
    searchParams.get('productId') || null
  )
  const [orderId, setOrderId] = useState<string | null>(
    searchParams.get('orderId') || null
  )
  const [initialMessage, setInitialMessage] = useState('')
  const [seller, setSeller] = useState<any>(null)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  useEffect(() => {
    if (sellerId) {
      fetchSeller()
    }
    if (productId) {
      fetchProduct()
    }
    // If orderId provided, fetch order to get seller_id
    if (orderId && !sellerId) {
      fetchOrder()
    }
  }, [sellerId, productId, orderId])

  const fetchOrder = async () => {
    if (!orderId) return

    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        // Get seller_id from first order item (order_items has seller_id directly)
        if (data.order?.items?.[0]?.seller_id) {
          setSellerId(data.order.items[0].seller_id)
          // Also fetch seller info
          const supabase = createClient()
          const { data: sellerData } = await supabase
            .from('users')
            .select('id, name, username, avatar_url, is_verified_teacher')
            .eq('id', data.order.items[0].seller_id)
            .single()
          if (sellerData) {
            setSeller(sellerData)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    }
  }

  const fetchSeller = async () => {
    if (!sellerId) return

    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, avatar_url, is_verified_teacher')
      .eq('id', sellerId)
      .single()

    if (data) {
      setSeller(data)
    }
  }

  const fetchProduct = async () => {
    if (!productId) return

    const supabase = createClient()
    const { data } = await supabase
      .from('products')
      .select('id, title, price, cover_image_url')
      .eq('id', productId)
      .single()

    if (data) {
      setProduct(data)
    }
  }

  const handleSearchSellers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    const supabase = createClient()
    const { data } = await supabase
      .from('users')
      .select('id, first_name, last_name, username, avatar_url, is_verified_teacher')
      .eq('can_sell', true)
      .or(`first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,username.ilike.%${searchQuery}%`)
      .limit(10)

    if (data) {
      setSearchResults(data)
    }
  }

  const handleSelectSeller = (selectedSeller: any) => {
    setSeller(selectedSeller)
    setSellerId(selectedSeller.id)
    setSearchQuery('')
    setSearchResults([])
  }

  const handleCreateConversation = async () => {
    if (!sellerId) {
      alert('Please select a seller')
      return
    }

    setLoading(true)
    try {
      const body: any = {
        seller_id: sellerId,
      }
      if (productId) {
        body.product_id = productId
      }
      if (searchParams.get('orderId')) {
        body.order_id = searchParams.get('orderId')
      }
      if (initialMessage.trim()) {
        body.initial_message = initialMessage.trim()
      }

      const response = await fetch('/api/messages/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create conversation')
      }

      const data = await response.json()
      router.push(`/messages/${data.conversation.id}`)
    } catch (error) {
      console.error('Error creating conversation:', error)
      alert(error instanceof Error ? error.message : 'Failed to create conversation. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container max-w-2xl mx-auto py-8 px-4">
      <Button
        variant="ghost"
        onClick={() => router.back()}
        className="mb-4"
      >
        <ArrowLeft className="size-4 mr-2" />
        Back
      </Button>

      <h1 className="text-2xl font-bold mb-6">New Message</h1>

      <Card className="p-6 space-y-6">
        {/* Seller Selection */}
        <div>
          <Label htmlFor="seller-search">Select Seller</Label>
          {seller ? (
            <div className="mt-2 p-3 border rounded-lg flex items-center gap-3">
              {seller.avatar_url ? (
                <Image
                  src={seller.avatar_url}
                  alt={getFullName(seller)}
                  width={40}
                  height={40}
                  className="rounded-full"
                />
              ) : (
                <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {getInitials(seller.first_name || '', seller.last_name || '')}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <p className="font-medium">{getFullName(seller)}</p>
                <p className="text-sm text-muted-foreground">@{seller.username}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSeller(null)
                  setSellerId(null)
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="mt-2 space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="seller-search"
                    placeholder="Search sellers..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      handleSearchSellers()
                    }}
                    className="pl-9"
                  />
                </div>
              </div>
              {searchResults.length > 0 && (
                <div className="border rounded-lg divide-y max-h-60 overflow-y-auto">
                  {searchResults.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleSelectSeller(result)}
                      className="w-full p-3 text-left hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {result.avatar_url ? (
                          <Image
                            src={result.avatar_url}
                          alt={getFullName(result)}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      ) : (
                        <div className="size-8 rounded-full bg-muted flex items-center justify-center">
                          <span className="text-xs font-medium">
                            {getInitials(result.first_name || '', result.last_name || '')}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium text-sm">{getFullName(result)}</p>
                          <p className="text-xs text-muted-foreground">
                            @{result.username}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Product Context (if productId provided) */}
        {product && (
          <div>
            <Label>Product</Label>
            <div className="mt-2 p-3 border rounded-lg flex items-center gap-3">
              {product.cover_image_url && (
                <Image
                  src={product.cover_image_url}
                  alt={product.title}
                  width={60}
                  height={60}
                  className="rounded object-cover"
                />
              )}
              <div className="flex-1">
                <p className="font-medium text-sm">{product.title}</p>
                <p className="text-sm text-primary font-semibold">
                  ₱{product.price.toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Initial Message */}
        <div>
          <Label htmlFor="initial-message">Message (Optional)</Label>
          <Textarea
            id="initial-message"
            value={initialMessage}
            onChange={(e) => setInitialMessage(e.target.value)}
            placeholder="Type your message here..."
            className="mt-2"
            rows={4}
          />
          <p className="text-xs text-muted-foreground mt-1">
            {initialMessage.length} / 1000
          </p>
        </div>

        {/* Create Button */}
        <Button
          onClick={handleCreateConversation}
          disabled={!sellerId || loading}
          className="w-full"
        >
          {loading ? 'Creating...' : 'Start Conversation'}
        </Button>
      </Card>
    </div>
  )
}
