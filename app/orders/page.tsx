'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import Link from 'next/link'
import { Package } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Order {
  id: string
  created_at: string
  total_amount: number
  payment_status: string
  refund_status: string | null
  item_count: number
}

export default function OrdersPage() {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/orders')
      if (!response.ok) {
        throw new Error('Failed to load orders')
      }

      const data = await response.json()
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const statusLabel = (order: Order) => {
    if (order.refund_status === 'approved') return 'Refunded'
    if (order.refund_status === 'requested') return 'Refund requested'
    if (order.payment_status === 'completed') return 'Completed'
    if (order.payment_status === 'pending') return 'Pending'
    if (order.payment_status === 'failed') return 'Failed'
    return order.payment_status
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading your orders...</p>
          </div>
        </div>
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Orders</h1>
        <Card className="p-12 text-center">
          <Package className="w-24 h-24 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-semibold mb-2">No orders yet</h2>
          <p className="text-muted-foreground mb-6">
            When you purchase resources, they will appear here.
          </p>
          <Button asChild>
            <Link href="/marketplace">Browse Marketplace</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        My Orders ({orders.length} {orders.length === 1 ? 'order' : 'orders'})
      </h1>
      <div className="space-y-4">
        {orders.map((order) => (
          <Card key={order.id} className="p-4 sm:p-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-sm text-muted-foreground">
                    #{order.id.slice(0, 8).toUpperCase()}
                  </span>
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded ${
                      order.payment_status === 'completed' && order.refund_status !== 'approved'
                        ? 'bg-green-100 text-green-800'
                        : order.payment_status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.refund_status === 'approved'
                            ? 'bg-gray-100 text-gray-700'
                            : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {statusLabel(order)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatDate(order.created_at)} · {order.item_count} {order.item_count === 1 ? 'item' : 'items'}
                </p>
                <p className="text-lg font-semibold mt-1">
                  ₱{order.total_amount.toFixed(2)}
                </p>
              </div>
              <Button asChild variant="outline" className="shrink-0">
                <Link href={`/orders/${order.id}/success`}>View order</Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
