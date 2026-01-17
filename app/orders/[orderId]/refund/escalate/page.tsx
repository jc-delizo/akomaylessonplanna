'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { ArrowLeft, AlertCircle } from 'lucide-react'

interface Order {
  id: string
  refund_status: string
  refund_requested_at?: string
}

export default function EscalateRefundPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()

  useEffect(() => {
    loadOrder()
  }, [])

  const loadOrder = async () => {
    try {
      const orderId = params.orderId as string
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      }
    } catch (error) {
      console.error('Error loading order:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!message || message.length < 20) {
      alert('Please provide a message (minimum 20 characters)')
      return
    }

    setSubmitting(true)
    try {
      const orderId = params.orderId as string
      const response = await fetch(`/api/orders/${orderId}/refund/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to escalate refund')
      }

      alert('Refund request escalated to platform support. You will be notified of the resolution within 3-5 business days.')
      router.push(`/orders/${orderId}/success`)
    } catch (error: any) {
      console.error('Error escalating refund:', error)
      alert(error.message || 'Failed to escalate refund. Please try again.')
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
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" asChild className="mb-6">
        <Link href={`/orders/${params.orderId}/success`}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Order
        </Link>
      </Button>

      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircle className="w-8 h-8 text-orange-600" />
          <h1 className="text-2xl font-bold">Escalate Refund to Platform</h1>
        </div>

        <p className="text-gray-600 mb-6">
          If the seller didn't respond within 48 hours or you disagree with their decision,
          you can escalate this refund request to our platform support team for mediation.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="message">Additional Information *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Please provide any additional information that might help us resolve this dispute (minimum 20 characters)..."
              rows={6}
              required
              minLength={20}
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length}/20 characters (minimum 20)
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>What happens next:</strong> Our support team will review both sides of
              the dispute and make a final decision within 3-5 business days. You will be
              notified via email once a decision has been made.
            </p>
          </div>

          <div className="flex gap-4">
            <Button type="submit" className="flex-1" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Escalate to Platform Support'}
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
