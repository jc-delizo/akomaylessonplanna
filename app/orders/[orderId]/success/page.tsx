'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { CheckCircle, Download, ShoppingBag, Mail, MessageSquare } from 'lucide-react'

interface OrderItem {
  id: string
  product_id: string
  seller_id: string
  product_title: string
  product_cover_image_url?: string
  price_at_purchase: number
  product?: {
    id: string
    seller_id: string
  }
}

interface Order {
  id: string
  total_amount: number
  item_count: number
  payment_method: string
  payment_status: string
  created_at: string
  completed_at?: string
  items: OrderItem[]
}

export default function OrderSuccessPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [completing, setCompleting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadOrder()
  }, [])

  const loadOrder = async () => {
    try {
      const orderId = params.orderId as string
      if (!orderId) {
        router.push('/cart')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const response = await fetch(`/api/orders/${orderId}`)
      if (!response.ok) {
        throw new Error('Failed to load order')
      }

      const data = await response.json()
      setOrder(data.order)

      // Auto-complete pending orders in development mode
      if (data.order.payment_status === 'pending') {
        try {
          const completeResponse = await fetch(`/api/orders/${orderId}/complete-test`, {
            method: 'POST',
          })
          if (completeResponse.ok) {
            // Reload order to get updated status
            const updatedResponse = await fetch(`/api/orders/${orderId}`)
            if (updatedResponse.ok) {
              const updatedData = await updatedResponse.json()
              setOrder(updatedData.order)
            }
          }
        } catch (error) {
          console.error('Error auto-completing order:', error)
          // Don't show error to user, just log it
        }
      }
    } catch (error) {
      console.error('Error loading order:', error)
      router.push('/cart')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteOrder = async () => {
    if (!order) return
    
    setCompleting(true)
    try {
      const response = await fetch(`/api/orders/${order.id}/complete-test`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to complete order')
      }

      // Reload order to get updated status
      const updatedResponse = await fetch(`/api/orders/${order.id}`)
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json()
        setOrder(updatedData.order)
        alert('Order completed! Products have been added to your library.')
      }
    } catch (error: any) {
      console.error('Error completing order:', error)
      alert(error.message || 'Failed to complete order. Please try again.')
    } finally {
      setCompleting(false)
    }
  }

  const handleDownload = async (productId: string) => {
    try {
      const response = await fetch(`/api/library/${productId}/download`)
      if (!response.ok) {
        throw new Error('Failed to download')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `product-${productId}.pdf` // Will be actual filename from API
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error downloading:', error)
      alert('Failed to download. Please try again.')
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading order details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-semibold mb-2">Order not found</h2>
          <p className="text-gray-600 mb-6">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button asChild>
            <Link href="/library">Go to My Library</Link>
          </Button>
        </Card>
      </div>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Message */}
      <Card className="p-8 text-center mb-6 bg-green-50 border-green-200">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h1 className="text-3xl font-bold mb-2">
          {order.payment_status === 'completed' ? 'Payment Successful! 🎉' : 'Order Created! ⏳'}
        </h1>
        <p className="text-lg text-gray-700">
          {order.payment_status === 'completed' 
            ? 'Your resources are ready for download!'
            : 'Processing your order...'}
        </p>
        {order.payment_status === 'pending' && (
          <div className="mt-4">
            <p className="text-sm text-yellow-600 mb-3 font-semibold">
              ⚠️ Development Mode: Order is pending payment
            </p>
            <Button
              onClick={handleCompleteOrder}
              disabled={completing}
              className="bg-yellow-600 hover:bg-yellow-700"
            >
              {completing ? 'Completing...' : 'Complete Order (Test Mode)'}
            </Button>
          </div>
        )}
        {order.payment_status === 'completed' && (
          <p className="text-sm text-gray-600 mt-2">
            A receipt has been sent to your email.
          </p>
        )}
      </Card>

      {/* Order Details */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Order Details</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Order ID:</span>
            <span className="font-mono">#{order.id.slice(0, 8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Date:</span>
            <span>{formatDate(order.completed_at || order.created_at)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Payment Method:</span>
            <span className="uppercase">{order.payment_method}</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold">Total Paid:</span>
            <span className="text-xl font-bold text-purple-600">
              ₱{order.total_amount.toFixed(2)}
            </span>
          </div>
        </div>
      </Card>

      {/* Download Section */}
      <Card className="p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Downloads</h2>
        <div className="space-y-4">
          {order.items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-4 p-4 border rounded-lg"
            >
              <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                {item.product_cover_image_url ? (
                  <img
                    src={item.product_cover_image_url}
                    alt={item.product_title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg
                      className="w-8 h-8"
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
              <div className="flex-1">
                <h3 className="font-semibold">{item.product_title}</h3>
                <p className="text-sm text-gray-600">
                  ₱{item.price_at_purchase.toFixed(2)}
                </p>
              </div>
              <Button
                onClick={() => handleDownload(item.product_id)}
                className="flex items-center gap-2"
                disabled={order.payment_status !== 'completed'}
              >
                <Download className="w-4 h-4" />
                {order.payment_status === 'completed' ? 'Download' : 'Processing...'}
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Messaging Prompt */}
      {order.items && order.items.length > 0 && order.items[0].seller_id && (
        <Card className="p-4 mb-4 bg-blue-50 border-blue-200">
          <p className="text-sm text-blue-900 mb-2">
            Have questions about your order? Message the seller for support.
          </p>
          <Link
            href={`/messages/new?sellerId=${order.items[0].seller_id}&orderId=${order.id}`}
          >
            <Button variant="outline" size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contact Seller
            </Button>
          </Link>
        </Card>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button className="flex-1" asChild>
          <Link href="/library">
            <ShoppingBag className="w-4 h-4 mr-2" />
            Go to My Library
          </Link>
        </Button>
        <Button variant="outline" className="flex-1" asChild>
          <Link href="/marketplace">Continue Shopping</Link>
        </Button>
      </div>

      {/* Email Notice */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <Mail className="w-4 h-4 inline mr-2" />
        A confirmation email has been sent to your registered email address.
      </div>
    </div>
  )
}
