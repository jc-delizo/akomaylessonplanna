'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { PullToRefresh } from '@/components/dashboard/pull-to-refresh'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Download,
  Filter,
  MapPin,
  MessageSquare,
  ExternalLink,
  Calendar,
  Package,
  DollarSign,
  User,
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/registry/default/dialog/dialog'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/default/select/select'
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/default/table/table'

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
    first_name: string
    last_name: string
    name?: string // For backward compatibility
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
  const [filtersOpen, setFiltersOpen] = useState(false)

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
      order.buyer ? formatBuyerName(order.buyer.first_name, order.buyer.last_name || '') : 'Anonymous',
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

  const formatBuyerName = (firstName: string, lastName: string) => {
    const first = (firstName || '').trim()
    const last = (lastName || '').trim()
    if (last) {
      return `Teacher ${first} ${last.charAt(0)}.`
    }
    return `Teacher ${first.charAt(0)}.`
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

  const clearFilters = () => {
    setStatusFilter('all')
    setDateFrom('')
    setDateTo('')
    setProductFilter('all')
    setLocationFilter('All regions')
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-600 hover:bg-green-700'
      case 'pending':
        return 'bg-yellow-600 hover:bg-yellow-700'
      case 'failed':
        return 'bg-red-600 hover:bg-red-700'
      default:
        return 'bg-gray-600 hover:bg-gray-700'
    }
  }

  // Calculate tab counts from orders with all filters applied EXCEPT status filter
  // This ensures counts are accurate regardless of which tab is active
  const getFilteredOrdersWithoutStatus = () => {
    let filtered = [...allOrders]

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

    return filtered
  }

  const ordersWithoutStatusFilter = getFilteredOrdersWithoutStatus()
  const filteredOrdersByStatus = {
    all: ordersWithoutStatusFilter,
    completed: ordersWithoutStatusFilter.filter((o) => o.order.payment_status === 'completed'),
    pending: ordersWithoutStatusFilter.filter((o) => o.order.payment_status === 'pending'),
    failed: ordersWithoutStatusFilter.filter((o) => o.order.payment_status === 'failed'),
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <Card className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-20 w-20 rounded-md" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-16 w-full" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={loadOrders}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-gray-600 mt-1">View and manage your sales</p>
          </div>
          <div className="flex gap-2">
            <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Filter Orders</SheetTitle>
                  <SheetDescription>
                    Refine your order list by status, date, product, or location
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 space-y-6">
                  {/* Status Filter */}
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={statusFilter}
                      onValueChange={(value) => setStatusFilter(value as any)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Orders</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Date Range */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Date From</Label>
                      <Input
                        type="date"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Date To</Label>
                      <Input
                        type="date"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                      />
                    </div>
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

                  <Separator />

                  {/* Product Filter */}
                  <div className="space-y-2">
                    <Label>Product</Label>
                    <Select
                      value={productFilter}
                      onValueChange={(value) => setProductFilter(value ?? 'all')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Products</SelectItem>
                        {getUniqueProducts().map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.title.length > 50
                              ? product.title.substring(0, 50) + '...'
                              : product.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Location Filter */}
                  <div className="space-y-2">
                    <Label>Location</Label>
                    <Select
                      value={locationFilter}
                      onValueChange={(value) => setLocationFilter(value ?? 'all')}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REGIONS.map((region) => (
                          <SelectItem key={region} value={region}>
                            {region}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={clearFilters}
                  >
                    Clear All Filters
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="outline"
              onClick={handleExportCSV}
              disabled={orders.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Orders List */}
        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 font-medium">No orders found</p>
            <p className="text-sm text-gray-500 mt-2">
              {statusFilter !== 'all' || dateFrom || dateTo || productFilter !== 'all' || locationFilter !== 'All regions'
                ? 'Try adjusting your filters'
                : 'Your orders will appear here once customers make purchases'}
            </p>
          </Card>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block">
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Product</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Earnings</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                              {order.product_cover_image_url ? (
                                <img
                                  src={order.product_cover_image_url}
                                  alt={order.product_title}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                  <Package className="h-5 w-5" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{order.product_title}</p>
                              <p className="text-xs text-gray-500">
                                {order.download_count} download{order.download_count !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <code className="text-xs font-mono">
                            {order.order.id.slice(0, 8).toUpperCase()}
                          </code>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              {order.buyer ? formatBuyerName(order.buyer.first_name, order.buyer.last_name || '') : 'Anonymous'}
                            </p>
                            {order.buyer?.location_region && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {order.buyer.location_region}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="text-sm">
                              {new Date(order.order.created_at).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(order.order.created_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="space-y-1">
                            <p className="font-medium">₱{order.price_at_purchase.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              -₱{order.commission_amount.toFixed(2)} fee
                            </p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <p className="font-semibold text-green-600">
                            ₱{order.net_earnings.toFixed(2)}
                          </p>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeVariant(order.order.payment_status)}>
                            {order.order.payment_status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedOrder(order)
                                setIsModalOpen(true)
                              }}
                            >
                              View
                            </Button>
                            <Link href={`/messages/new?buyerId=${order.order.buyer_id}&orderId=${order.order.id}`}>
                              <Button variant="ghost" size="sm">
                                <MessageSquare className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex gap-4 mb-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                      {order.product_cover_image_url ? (
                        <img
                          src={order.product_cover_image_url}
                          alt={order.product_title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm mb-1 line-clamp-2">
                        {order.product_title}
                      </h3>
                      <p className="text-xs text-gray-500">
                        Order #{order.order.id.slice(0, 8).toUpperCase()}
                      </p>
                    </div>
                    <Badge className={getStatusBadgeVariant(order.order.payment_status)}>
                      {order.order.payment_status.toUpperCase()}
                    </Badge>
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Price</p>
                      <p className="font-semibold">₱{order.price_at_purchase.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Earnings</p>
                      <p className="font-semibold text-green-600">
                        ₱{order.net_earnings.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Buyer</p>
                      <p className="text-sm">
                        {order.buyer ? formatBuyerName(order.buyer.first_name, order.buyer.last_name || '') : 'Anonymous'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Date</p>
                      <p className="text-sm">
                        {new Date(order.order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSelectedOrder(order)
                        setIsModalOpen(true)
                      }}
                    >
                      View Details
                    </Button>
                    <Link
                      href={`/messages/new?buyerId=${order.order.buyer_id}&orderId=${order.order.id}`}
                      className="flex-1"
                    >
                      <Button variant="outline" size="sm" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Contact
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Order Detail Modal */}
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
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
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Product
                  </h3>
                  <div className="flex gap-4">
                    {selectedOrder.product_cover_image_url && (
                      <img
                        src={selectedOrder.product_cover_image_url}
                        alt={selectedOrder.product_title}
                        className="w-24 h-24 object-cover rounded-md"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{selectedOrder.product_title}</p>
                      <Link
                        href={`/products/${selectedOrder.product_id}`}
                        className="text-sm text-[#ff7200] hover:underline flex items-center gap-1 mt-2"
                      >
                        View Product Listing
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Pricing Section */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Pricing Breakdown
                  </h3>
                  <Card className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Product price:</span>
                      <span className="font-semibold">₱{selectedOrder.price_at_purchase.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span className="text-sm">
                        Platform commission ({selectedOrder.commission_rate}%):
                      </span>
                      <span className="font-semibold">
                        -₱{selectedOrder.commission_amount.toFixed(2)}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="font-semibold">Your earnings:</span>
                      <span className="font-bold text-green-600 text-lg">
                        ₱{selectedOrder.net_earnings.toFixed(2)}
                      </span>
                    </div>
                  </Card>
                </div>

                <Separator />

                {/* Buyer Information */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Buyer Information
                  </h3>
                  <Card className="p-4 space-y-2">
                    <p className="font-medium">
                      {selectedOrder.buyer
                        ? formatBuyerName(selectedOrder.buyer.first_name, selectedOrder.buyer.last_name || '')
                        : 'Anonymous'}
                    </p>
                    {selectedOrder.buyer?.location_region && (
                      <p className="flex items-center gap-2 text-sm text-gray-600">
                        <MapPin className="h-4 w-4" />
                        {selectedOrder.buyer.location_region}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Downloaded: {selectedOrder.download_count} time
                      {selectedOrder.download_count !== 1 ? 's' : ''}
                    </p>
                  </Card>
                </div>

                <Separator />

                {/* Payment Section */}
                <div>
                  <h3 className="font-semibold mb-3">Payment Details</h3>
                  <Card className="p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Method:</span>
                      <span className="uppercase font-medium">
                        {selectedOrder.order.payment_method}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Status:</span>
                      <Badge className={getStatusBadgeVariant(selectedOrder.order.payment_status)}>
                        {selectedOrder.order.payment_status.toUpperCase()}
                      </Badge>
                    </div>
                  </Card>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4">
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/messages/new?buyerId=${selectedOrder.order.buyer_id}&orderId=${selectedOrder.order.id}`}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Buyer
                    </Link>
                  </Button>
                  <Button variant="outline" className="flex-1" asChild>
                    <Link href={`/products/${selectedOrder.product_id}`}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Product
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
