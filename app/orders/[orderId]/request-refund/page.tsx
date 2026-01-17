'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

interface Order {
  id: string
  total_amount: number
  created_at: string
  refund_status: string
  items: Array<{
    id: string
    product_title: string
    price_at_purchase: number
  }>
}

const REFUND_REASONS = [
  'Defective or corrupted files',
  'Product not as described',
  'Technical issues preventing download',
  'Inappropriate content',
  'Other',
]

export default function RequestRefundPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadOrder()
  }, [])

  const loadOrder = async () => {
    try {
      const orderId = params.orderId as string
      if (!orderId) {
        router.push('/library')
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

      // Check if refund window has expired (7 days)
      const orderDate = new Date(data.order.created_at)
      const daysSincePurchase = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSincePurchase > 7) {
        alert('Refund window has expired. Refunds must be requested within 7 days of purchase.')
        router.push(`/orders/${orderId}/success`)
      }
    } catch (error) {
      console.error('Error loading order:', error)
      router.push('/library')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reason || !description || description.length < 20) {
      alert('Please provide a reason and description (minimum 20 characters)')
      return
    }

    setSubmitting(true)
    try {
      const orderId = params.orderId as string
      const response = await fetch(`/api/orders/${orderId}/request-refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reason: reason,
          description: description,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to submit refund request')
      }

      alert('Refund request submitted successfully! The seller has 48 hours to respond.')
      router.push(`/orders/${orderId}/success`)
    } catch (error: any) {
      console.error('Error submitting refund request:', error)
      alert(error.message || 'Failed to submit refund request. Please try again.')
    } finally {
      setSubmitting(false)
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
          <Button asChild className="mt-4">
            <Link href="/library">Go to My Library</Link>
          </Button>
        </Card>
      </div>
    )
  }

  if (order.refund_status !== 'none') {
    return (
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="p-6">
          <AlertCircle className="w-12 h-12 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-center mb-2">
            Refund Request {order.refund_status === 'requested' ? 'Already Submitted' : order.refund_status === 'approved' ? 'Approved' : 'Rejected'}
          </h2>
          <p className="text-center text-gray-600 mb-6">
            {order.refund_status === 'requested' &&
              'Your refund request is being reviewed by the seller. They have 48 hours to respond.'}
            {order.refund_status === 'approved' &&
              'Your refund has been approved and will be processed within 1-3 business days.'}
            {order.refund_status === 'rejected' &&
              'Your refund request was rejected by the seller. You can escalate to platform support if needed.'}
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild>
              <Link href={`/orders/${order.id}/success`}>View Order</Link>
            </Button>
            {order.refund_status === 'rejected' && (
              <Button variant="outline" asChild>
                <Link href={`/orders/${order.id}/refund/escalate`}>Escalate to Platform</Link>
              </Button>
            )}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/orders/${order.id}/success`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Order
        </Link>
      </Button>

      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-2">Request Refund</h1>
        <p className="text-gray-600 mb-6">
          Please provide details about why you're requesting a refund. The seller will review your request and respond within 48 hours.
        </p>

        {/* Order Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Order Details</h3>
          <p className="text-sm text-gray-600 mb-1">
            Order #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-sm text-gray-600 mb-1">
            Purchased: {new Date(order.created_at).toLocaleDateString()}
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Total: ₱{order.total_amount.toFixed(2)}
          </p>
          <div className="border-t pt-2">
            <p className="text-sm font-medium">Items:</p>
            {order.items.map((item) => (
              <p key={item.id} className="text-sm text-gray-600">
                • {item.product_title} - ₱{item.price_at_purchase.toFixed(2)}
              </p>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="reason">Reason for Refund *</Label>
            <select
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-600"
              required
            >
              <option value="">Select a reason</option>
              {REFUND_REASONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide details about the issue (minimum 20 characters)..."
              rows={6}
              required
              minLength={20}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {description.length}/20 characters (minimum 20)
            </p>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Refund Policy:</strong> Refunds must be requested within 7 days of purchase.
              The seller has 48 hours to respond. If the seller doesn't respond or you disagree
              with their decision, you can escalate to platform support.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Refund Request'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
