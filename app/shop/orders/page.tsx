'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PullToRefresh } from '@/components/dashboard/pull-to-refresh'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Download,
  Filter,
  X,
  MapPin,
  MessageSquare,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/registry/default/dialog/dialog'

interface OrderItem {
  id: string
  order_id: string
  product_id: string
  product_title: string
  product_cover_image_url?: string
  price_at_purchase: number
  commission_rate: number
  commission_amount: number
  net_earnings: number
  download_count: number
  created_at: string
  order: {
    id: string
    created_at: string
    payment_method: string
    payment_status: string
    buyer_id: string
  }
  buyer?: {
    id: string
    name: string
    location_region?: string | null
  }
}

const REGIONS = ['All regions', 'NCR', 'Luzon', 'Visayas', 'Mindanao']

export default function SellerOrdersPage() {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [allOrders, setAllOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [locationFilter, setLocationFilter] = useState('All regions')

  useEffect(() => {
    loadOrders()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [statusFilter, dateFrom, dateTo, productFilter, locationFilter, allOrders])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/seller/orders?status=all')
      if (!response.ok) {
        throw new Error('Failed to load orders')
      }

      const data = await response.json()
      setAllOrders(data.orders || [])
      setOrders(data.orders || [])
    } catch (error) {
      console.error('Error loading orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...allOrders]

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((o) => o.order.payment_status === statusFilter)
    }

    // Date range filter
    if (dateFrom) {
      filtered = filtered.filter(
        (o) => new Date(o.order.created_at) >= new Date(dateFrom)
      )
    }
    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      filtered = filtered.filter((o) => new Date(o.order.created_at) <= toDate)
    }

    // Product filter
    if (productFilter !== 'all') {
      filtered = filtered.filter((o) => o.product_id === productFilter)
    }

    // Location filter
    if (locationFilter !== 'All regions') {
      filtered = filtered.filter(
        (o) => o.buyer?.location_region === locationFilter
      )
    }

    setOrders(filtered)
  }

  const handleExportCSV = () => {
    const headers = [
      'Order ID',
      'Date',
      'Product',
      'Buyer',
      'Location',
      'Price',
      'Commission',
      'Net Earnings',
      'Payment Method',
      'Status',
      'Downloads',
    ]

    const rows = orders.map((order) => [
      order.order.id.slice(0, 8).toUpperCase(),
      new Date(order.order.created_at).toLocaleDateString(),
      order.product_title,
      order.buyer ? formatBuyerName(order.buyer.name) : 'Anonymous',
      order.buyer?.location_region || 'N/A',
      `₱${order.price_at_purchase.toFixed(2)}`,
      `₱${order.commission_amount.toFixed(2)} (${order.commission_rate}%)`,
      `₱${order.net_earnings.toFixed(2)}`,
      order.order.payment_method.toUpperCase(),
      order.order.payment_status.toUpperCase(),
      order.download_count.toString(),
    ])

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `orders-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
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

  const formatBuyerName = (name: string) => {
    const parts = name.split(' ')
    if (parts.length >= 2) {
      return `Teacher ${parts[0]} ${parts[parts.length - 1].charAt(0)}.`
    }
    return `Teacher ${name.charAt(0)}.`
  }

  const getUniqueProducts = () => {
    const products = new Map<string, string>()
    allOrders.forEach((order) => {
      if (!products.has(order.product_id)) {
        products.set(order.product_id, order.product_title)
      }
    })
    return Array.from(products.entries()).map(([id, title]) => ({ id, title }))
  }

  const handleQuickDateFilter = (days: number) => {
    const today = new Date()
    const fromDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000)
    setDateFrom(fromDate.toISOString().split('T')[0])
    setDateTo(today.toISOString().split('T')[0])
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={loadOrders}>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Orders</h1>
          <p className="text-gray-600 mt-1">View and manage your sales</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" onClick={handleExportCSV} disabled={orders.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Filters</h3>
            <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Status Filter */}
            <div>
              <Label className="mb-2 block">Status</Label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="all">All Orders</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            {/* Date Range */}
            <div>
              <Label className="mb-2 block">Date From</Label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div>
              <Label className="mb-2 block">Date To</Label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            {/* Quick Date Filters */}
            <div>
              <Label className="mb-2 block">Quick Filters</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter(7)}
                >
                  Last 7 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickDateFilter(30)}
                >
                  Last 30 days
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom('')
                    setDateTo('')
                  }}
                >
                  Clear
                </Button>
              </div>
            </div>

            {/* Product Filter */}
            <div>
              <Label className="mb-2 block">Product</Label>
              <select
                value={productFilter}
                onChange={(e) => setProductFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="all">All Products</option>
                {getUniqueProducts().map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.title.length > 40
                      ? product.title.substring(0, 40) + '...'
                      : product.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Location Filter */}
            <div>
              <Label className="mb-2 block">Location</Label>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                {REGIONS.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Orders List */}
      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-gray-600">No orders found.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Product Image */}
                <div className="w-24 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                  {order.product_cover_image_url ? (
                    <img
                      src={order.product_cover_image_url}
                      alt={order.product_title}
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

                {/* Order Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{order.product_title}</h3>
                      <p className="text-sm text-gray-600">
                        Order #{order.order.id.slice(0, 8).toUpperCase()} •{' '}
                        {formatDate(order.order.created_at)}
                      </p>
                    </div>
                    <Badge
                      className={
                        order.order.payment_status === 'completed'
                          ? 'bg-green-600'
                          : order.order.payment_status === 'pending'
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }
                    >
                      {order.order.payment_status.toUpperCase()}
                    </Badge>
                  </div>

                  {/* Pricing Breakdown */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Product Price</p>
                      <p className="font-semibold">₱{order.price_at_purchase.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">
                        Commission ({order.commission_rate}%)
                      </p>
                      <p className="font-semibold text-red-600">
                        -₱{order.commission_amount.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Your Earnings</p>
                      <p className="font-semibold text-green-600">
                        ₱{order.net_earnings.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Downloads</p>
                      <p className="font-semibold">{order.download_count} times</p>
                    </div>
                  </div>

                  {/* Buyer Info & Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                      {order.buyer ? (
                        <>
                          <span>Buyer: {formatBuyerName(order.buyer.name)}</span>
                          {order.buyer.location_region && (
                            <>
                              <span className="mx-2">•</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.buyer.location_region}
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <span>Buyer: Anonymous</span>
                      )}
                      <span className="mx-2">•</span>
                      <span className="uppercase">{order.order.payment_method}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order)
                          setIsModalOpen(true)
                        }}
                      >
                        View Details
                      </Button>
                      <Link href={`/messages/new?buyerId=${order.order.buyer_id}&orderId=${order.order.id}`}>
                        <Button variant="outline" size="sm">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Contact Buyer
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Order Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={(open) => setIsModalOpen(open)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Order #{selectedOrder?.order.id.slice(0, 8).toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDate(selectedOrder.order.created_at)}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6 mt-4">
              {/* Product Section */}
              <div>
                <h3 className="font-semibold mb-2">PRODUCT</h3>
                <div className="flex gap-4">
                  {selectedOrder.product_cover_image_url && (
                    <img
                      src={selectedOrder.product_cover_image_url}
                      alt={selectedOrder.product_title}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium">{selectedOrder.product_title}</p>
                    <Link
                      href={`/products/${selectedOrder.product_id}`}
                      className="text-sm text-purple-600 hover:underline flex items-center gap-1 mt-1"
                    >
                      View Product Listing
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Pricing Section */}
              <div>
                <h3 className="font-semibold mb-2">PRICING</h3>
                <div className="space-y-2 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between">
                    <span>Product price:</span>
                    <span className="font-semibold">₱{selectedOrder.price_at_purchase.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-red-600">
                    <span>Platform commission ({selectedOrder.commission_rate}%):</span>
                    <span className="font-semibold">
                      -₱{selectedOrder.commission_amount.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Your earnings:</span>
                    <span className="font-bold text-green-600">
                      ₱{selectedOrder.net_earnings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buyer Information */}
              <div>
                <h3 className="font-semibold mb-2">BUYER INFORMATION</h3>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <p>
                    {selectedOrder.buyer
                      ? formatBuyerName(selectedOrder.buyer.name)
                      : 'Anonymous'}
                  </p>
                  {selectedOrder.buyer?.location_region && (
                    <p className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin className="h-4 w-4" />
                      Location: {selectedOrder.buyer.location_region}
                    </p>
                  )}
                  <p className="text-sm text-gray-600">
                    Downloaded: {selectedOrder.download_count} time
                    {selectedOrder.download_count !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Payment Section */}
              <div>
                <h3 className="font-semibold mb-2">PAYMENT</h3>
                <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span>Method:</span>
                    <span className="uppercase font-medium">
                      {selectedOrder.order.payment_method}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <Badge
                      className={
                        selectedOrder.order.payment_status === 'completed'
                          ? 'bg-green-600'
                          : selectedOrder.order.payment_status === 'pending'
                          ? 'bg-yellow-600'
                          : 'bg-red-600'
                      }
                    >
                      {selectedOrder.order.payment_status.toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t">
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/messages/new?buyerId=${selectedOrder.order.buyer_id}&orderId=${selectedOrder.order.id}`}>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Buyer
                    </Button>
                  </Link>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <Link href={`/products/${selectedOrder.product_id}`}>
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Product Listing
                  </Link>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      </div>
    </PullToRefresh>
  )
}
