'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/dashboard/pull-to-refresh'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { GlareButton } from '@/components/ui/glare-button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Grid3x3,
  List,
  Edit,
  Trash2,
  Copy,
  Eye,
  TrendingUp,
  AlertCircle,
  MoreVertical,
  EyeOff,
  Send,
  ShoppingBag,
  Star,
  Plus,
  Package,
  CheckCircle,
  FileText,
  Clock,
  XCircle,
  Pause,
  Download,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/registry/default/select/select'
import { SellerProductCard } from '@/components/products/seller-product-card'

interface Product {
  id: string
  title: string
  description: string
  price: number
  cover_image_url?: string
  product_type: string
  status: string
  views_count: number
  sales_count: number
  avg_rating?: number
  reviews_count: number
  conversion_rate?: number
  created_at: string
  published_at?: string
  grade: { name: string }
  subject: { name: string }
}

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500',
  pending_review: 'bg-yellow-500',
  published: 'bg-green-500',
  rejected: 'bg-red-500',
  suspended: 'bg-orange-500',
  deleted: 'bg-gray-400',
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  published: 'Published',
  rejected: 'Rejected',
  suspended: 'Suspended',
  deleted: 'Deleted',
}

// Filter icons mapping
const FILTER_ICONS: Record<string, typeof Package> = {
  all: Package,
  published: CheckCircle,
  draft: FileText,
  pending_review: Clock,
  rejected: XCircle,
  suspended: Pause,
}

type ViewMode = 'grid' | 'list'

export default function MyProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [subscriptionTier, setSubscriptionTier] = useState<'free' | 'pro' | 'pioneer'>('free')
  const [exportFormat, setExportFormat] = useState<'csv' | 'xlsx' | 'pdf'>('csv')
  const [exporting, setExporting] = useState(false)

  // Load preferences from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('products-view-mode') as ViewMode
    if (savedView === 'grid' || savedView === 'list') {
      setViewMode(savedView)
    }
    const savedFilter = localStorage.getItem('products-filter-status')
    if (savedFilter) {
      setFilterStatus(savedFilter)
    }
  }, [])

  // Save filter status to localStorage
  useEffect(() => {
    if (filterStatus) {
      localStorage.setItem('products-filter-status', filterStatus)
    }
  }, [filterStatus])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)

        // Fetch user profile for subscription tier
        const profileResponse = await fetch('/api/me/profile')
        if (profileResponse.ok) {
          const { profile } = await profileResponse.json()
          setSubscriptionTier(profile.subscription_tier || 'free')
        }

        // Fetch products
        const response = await fetch('/api/me/products')
        if (response.status === 401) {
          router.push('/login')
          return
        }

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const { products: fetchedProducts } = await response.json()
        setProducts(fetchedProducts || [])
      } catch (err) {
        console.error('Error fetching data:', err)
        setError('Failed to load products')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    localStorage.setItem('products-view-mode', mode)
  }

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(productId)) {
        newSet.delete(productId)
      } else {
        newSet.add(productId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set())
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)))
    }
  }

  const handleBulkAction = async (action: 'unpublish' | 'delete' | 'publish' | 'draft') => {
    if (selectedProducts.size === 0) {
      alert('Please select at least one product')
      return
    }

    if (action === 'delete') {
      if (!confirm(`Are you sure you want to delete ${selectedProducts.size} product(s)?`)) {
        return
      }
    }

    try {
      const response = await fetch('/api/seller/products/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_ids: Array.from(selectedProducts),
          action,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to perform bulk action')
      }

      // Refresh products
      const productsResponse = await fetch('/api/me/products')
      if (productsResponse.ok) {
        const { products: fetchedProducts } = await productsResponse.json()
        setProducts(fetchedProducts || [])
      }

      setSelectedProducts(new Set())
      alert(`Successfully ${action}ed ${selectedProducts.size} product(s)`)
    } catch (err) {
      console.error('Error performing bulk action:', err)
      alert('Failed to perform bulk action')
    }
  }

  const handleDuplicate = async (productId: string) => {
    try {
      const response = await fetch(`/api/seller/products/duplicate/${productId}`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate product')
      }

      const { product } = await response.json()
      router.push(`/shop/products/${product.id}/edit`)
    } catch (err) {
      console.error('Error duplicating product:', err)
      alert('Failed to duplicate product')
    }
  }

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? It will be removed after 30 days.')) {
      return
    }

    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId))
        alert('Product deleted successfully')
      } else {
        const { error: apiError } = await response.json()
        alert(apiError || 'Failed to delete product')
      }
    } catch (err) {
      console.error('Error deleting product:', err)
      alert('Failed to delete product')
    }
  }

  const handleTogglePublish = async (productId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'published' ? 'draft' : 'published'
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, status: newStatus } : p))
        )
      }
    } catch (err) {
      console.error('Error toggling publish status:', err)
    }
  }

  const filteredProducts =
    filterStatus === 'all'
      ? products
      : products.filter((p) => p.status === filterStatus)

  const isProOrPioneer = subscriptionTier === 'pro' || subscriptionTier === 'pioneer'

  const handleExport = async () => {
    if (exportFormat === 'csv') {
      const headers = [
        'Title',
        'Price',
        'Status',
        'Views',
        'Sales',
        'Rating',
        'Reviews',
        'Conversion Rate',
        'Created Date',
      ]
      const rows = filteredProducts.map((p) => [
        p.title,
        `₱${p.price.toFixed(2)}`,
        p.status,
        (p.views_count || 0).toString(),
        (p.sales_count || 0).toString(),
        p.avg_rating ? p.avg_rating.toFixed(1) : 'N/A',
        (p.reviews_count || 0).toString(),
        p.conversion_rate ? `${p.conversion_rate.toFixed(2)}%` : '0%',
        new Date(p.created_at).toLocaleDateString(),
      ])
      const csvContent = [headers, ...rows]
        .map((row) => row.map((cell) => `"${cell}"`).join(','))
        .join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `products-${new Date().toISOString().split('T')[0]}.csv`
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      return
    }
    setExporting(true)
    try {
      const res = await fetch('/api/seller/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          export_type: 'products',
          format: exportFormat,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        alert(err.error || 'Export failed')
        setExporting(false)
        return
      }
      const { job_id } = await res.json()
      let attempts = 0
      const poll = async () => {
        const j = await fetch(`/api/seller/export/${job_id}`).then((r) => r.json())
        if (j.status === 'completed' && j.file_url) {
          window.open(j.file_url, '_blank')
          setExporting(false)
          return
        }
        if (j.status === 'failed') {
          alert(j.error_message || 'Export failed')
          setExporting(false)
          return
        }
        if (++attempts < 30) setTimeout(poll, 1500)
        else setExporting(false)
      }
      setTimeout(poll, 1000)
    } catch (e) {
      setExporting(false)
      alert('Export failed')
    }
  }

  // Calculate stats
  const stats = {
    total: products.length,
    published: products.filter((p) => p.status === 'published').length,
    draft: products.filter((p) => p.status === 'draft').length,
    pending: products.filter((p) => p.status === 'pending_review').length,
  }

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>

        {/* Desktop Layout Skeleton */}
        <div className="hidden md:flex gap-6">
          {/* Sidebar skeleton */}
          <div className="w-64 space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          {/* Content skeleton */}
          <div className="flex-1 space-y-4">
            <div className="flex justify-end gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-[4/3] w-full" />
                  <CardContent className="p-4 space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                    <Skeleton className="h-6 w-20" />
                    <div className="flex gap-2">
                      <Skeleton className="h-8 flex-1" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Mobile Layout Skeleton */}
        <div className="md:hidden space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
          <div className="flex justify-end gap-2">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="aspect-[4/3] w-full" />
                <CardContent className="p-4 space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <PullToRefresh onRefresh={async () => {
      const response = await fetch('/api/me/products')
      if (response.ok) {
        const { products: fetchedProducts } = await response.json()
        setProducts(fetchedProducts || [])
      }
    }}>
      <div className="space-y-6">
        {/* Page Header - Settings Style */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-[#ff7200] to-[#e66500]">
              <ShoppingBag className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Shop</h1>
              <p className="text-sm text-gray-600 mt-0.5">
                Manage and organize your products
              </p>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <Select
              value={exportFormat}
              onValueChange={(v) => setExportFormat(v as 'csv' | 'xlsx' | 'pdf')}
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="xlsx" disabled={!isProOrPioneer}>
                  Excel{!isProOrPioneer ? ' (Pro only)' : ''}
                </SelectItem>
                <SelectItem value="pdf" disabled={!isProOrPioneer}>
                  PDF{!isProOrPioneer ? ' (Pro only)' : ''}
                </SelectItem>
              </SelectContent>
            </Select>
            {!isProOrPioneer && (
              <Link href="/shop/upgrade" className="text-sm text-[#ff7200] hover:underline">
                Unlock with Pro
              </Link>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredProducts.length === 0 || exporting}
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Exporting…' : `Export ${exportFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>

        {error && (
          <Card className="border-destructive/50 bg-destructive/10">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Desktop: Vertical Sidebar + Content */}
        <div className="hidden md:flex gap-6">
          {/* Vertical Navigation Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <nav className="space-y-1">
              {[
                { id: 'all', label: 'All Products', count: products.length },
                { id: 'published', label: 'Published', count: stats.published },
                { id: 'draft', label: 'Draft', count: stats.draft },
                { id: 'pending_review', label: 'Pending Review', count: stats.pending },
                { id: 'rejected', label: 'Rejected', count: products.filter((p) => p.status === 'rejected').length },
                { id: 'suspended', label: 'Suspended', count: products.filter((p) => p.status === 'suspended').length },
              ].map((filter) => {
                const Icon = FILTER_ICONS[filter.id] || Package
                const isActive = filterStatus === filter.id
                return (
                  <button
                    key={filter.id}
                    onClick={() => setFilterStatus(filter.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-gray-900 dark:bg-gray-800 text-white border-l-4 border-gray-900 dark:border-gray-700'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="size-5 flex-shrink-0" />
                      <span>{filter.label}</span>
                    </div>
                    <Badge
                      variant={isActive ? 'secondary' : 'outline'}
                      className={cn(
                        'h-5 px-1.5 text-xs',
                        isActive && 'bg-white/20 text-white border-white/30'
                      )}
                    >
                      {filter.count}
                    </Badge>
                  </button>
                )
              })}
            </nav>
          </aside>

          {/* Content Area */}
          <div className="flex-1 min-w-0 space-y-4">
            {/* View mode toggle */}
            <div className="flex items-center justify-end gap-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('grid')}
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleViewModeChange('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>

            {/* Bulk Actions Bar */}
            {selectedProducts.size > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Badge variant="default" className="h-7 px-3 text-sm font-semibold">
                        {selectedProducts.size} selected
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {selectedProducts.size === 1 ? 'product' : 'products'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('publish')}
                      >
                        <Send className="h-3 w-3 mr-1.5" />
                        Publish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('unpublish')}
                      >
                        <EyeOff className="h-3 w-3 mr-1.5" />
                        Unpublish
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('draft')}
                      >
                        Move to Draft
                      </Button>
                      <Separator orientation="vertical" className="h-4" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleBulkAction('delete')}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1.5" />
                        Delete
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedProducts(new Set())}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Display */}
        {filteredProducts.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="pt-12 pb-12">
              <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                <div className="rounded-full bg-muted p-6">
                  <Package className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-xl">No products found</CardTitle>
                  <CardDescription className="text-base">
                    {filterStatus === 'all'
                      ? 'Get started by creating your first product and share your educational resources with the community.'
                      : `You don't have any products with status "${STATUS_LABELS[filterStatus]}"`}
                  </CardDescription>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredProducts.map((product) => {
              const conversionRate = product.conversion_rate || 0
              const isTrending =
                isProOrPioneer && product.views_count > 100 && conversionRate > 5
              const isLowConversion =
                isProOrPioneer && product.views_count > 100 && conversionRate < 2
              return (
                <div key={product.id} className="relative">
                  <SellerProductCard
                    product={product}
                    onTogglePublish={handleTogglePublish}
                    onDuplicate={handleDuplicate}
                    onDelete={handleDelete}
                    showTrendingBadge={isTrending}
                    showLowConversionBadge={isLowConversion}
                    trafficSource="direct"
                  />
                  {/* Checkbox for bulk selection - overlay */}
                  <div className="absolute top-2 left-2 z-20">
                    <div className="bg-background/80 backdrop-blur-sm rounded p-0.5">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => handleSelectProduct(product.id)}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {/* List View Header with Select All */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={
                      filteredProducts.length > 0 &&
                      selectedProducts.size === filteredProducts.length
                    }
                    onCheckedChange={handleSelectAll}
                  />
                  <span className="text-sm font-medium">Select All</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-sm text-muted-foreground">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {filteredProducts.map((product, index) => (
              <Card key={product.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row gap-4 p-6">
                    {/* Checkbox */}
                    <div className="flex items-start pt-1 sm:pt-0">
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => handleSelectProduct(product.id)}
                      />
                    </div>

                    {/* Thumbnail */}
                    <div className="w-full sm:w-32 h-48 sm:h-32 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                      {product.cover_image_url ? (
                        <img
                          src={product.cover_image_url}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                          <Skeleton className="w-full h-full" />
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 space-y-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <CardTitle className="text-lg">{product.title}</CardTitle>
                          <Badge
                            className={`${STATUS_COLORS[product.status]} text-white`}
                          >
                            {STATUS_LABELS[product.status]}
                          </Badge>
                        </div>
                        <CardDescription>
                          {product.grade.name} • {product.subject.name} •{' '}
                          {product.product_type.replace('_', ' ')}
                        </CardDescription>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {product.description}
                        </p>
                      </div>

                      <Separator />

                      {/* Stats */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="font-semibold text-lg text-orange-600">
                            ₱{product.price.toFixed(2)}
                          </span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Eye className="h-4 w-4" />
                          <span>{product.views_count.toLocaleString()}</span>
                        </div>
                        <Separator orientation="vertical" className="h-4" />
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <ShoppingBag className="h-4 w-4" />
                          <span>{product.sales_count.toLocaleString()}</span>
                        </div>
                        {product.avg_rating && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="flex items-center gap-1.5">
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                              <span className="font-medium">
                                {product.avg_rating.toFixed(1)}
                              </span>
                              <span className="text-muted-foreground">
                                ({product.reviews_count})
                              </span>
                            </div>
                          </>
                        )}
                        {product.conversion_rate && (
                          <>
                            <Separator orientation="vertical" className="h-4" />
                            <div className="text-muted-foreground">
                              📊 {product.conversion_rate.toFixed(1)}%
                            </div>
                          </>
                        )}
                      </div>

                      <Separator />

                      {/* Actions */}
                      <div className="flex flex-wrap gap-2">
                        <Link href={`/products/${product.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1.5" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/shop/products/${product.id}/edit`}>
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4 mr-1.5" />
                            Edit
                          </Button>
                        </Link>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDuplicate(product.id)}
                        >
                          <Copy className="h-4 w-4 mr-1.5" />
                          Duplicate
                        </Button>
                        {product.status !== 'deleted' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(product.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4 mr-1.5" />
                            Delete
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
                {index < filteredProducts.length - 1 && (
                  <Separator className="mx-6" />
                )}
              </Card>
            ))}
          </div>
        )}
          </div>
        </div>

        {/* Mobile: Horizontal Tabs */}
        <div className="md:hidden space-y-4">
          <Tabs value={filterStatus} onValueChange={setFilterStatus} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              {[
                { id: 'all', label: 'All' },
                { id: 'published', label: 'Published' },
                { id: 'draft', label: 'Draft' },
                { id: 'pending_review', label: 'Pending' },
                { id: 'rejected', label: 'Rejected' },
                { id: 'suspended', label: 'Suspended' },
              ].map((filter) => {
                const Icon = FILTER_ICONS[filter.id] || Package
                return (
                  <TabsTrigger
                    key={filter.id}
                    value={filter.id}
                    className="flex flex-col items-center gap-1 h-auto py-2"
                  >
                    <Icon className="size-4" />
                    <span className="text-xs">{filter.label}</span>
                  </TabsTrigger>
                )
              })}
            </TabsList>
          </Tabs>

          {/* View mode toggle */}
          <div className="flex items-center justify-end gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('grid')}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>

          {/* Bulk Actions Bar */}
          {selectedProducts.size > 0 && (
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="default" className="h-7 px-3 text-sm font-semibold">
                      {selectedProducts.size} selected
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {selectedProducts.size === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('publish')}
                    >
                      <Send className="h-3 w-3 mr-1.5" />
                      Publish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('unpublish')}
                    >
                      <EyeOff className="h-3 w-3 mr-1.5" />
                      Unpublish
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('draft')}
                    >
                      Move to Draft
                    </Button>
                    <Separator orientation="vertical" className="h-4" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('delete')}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="h-3 w-3 mr-1.5" />
                      Delete
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedProducts(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Display */}
          {filteredProducts.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="pt-12 pb-12">
                <div className="flex flex-col items-center justify-center text-center space-y-4 max-w-md mx-auto">
                  <div className="rounded-full bg-muted p-6">
                    <Package className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-xl">No products found</CardTitle>
                    <CardDescription className="text-base">
                      {filterStatus === 'all'
                        ? 'Get started by creating your first product and share your educational resources with the community.'
                        : `You don't have any products with status "${STATUS_LABELS[filterStatus]}"`}
                    </CardDescription>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 md:gap-6">
              {filteredProducts.map((product) => {
                const conversionRate = product.conversion_rate || 0
                const isTrending =
                  isProOrPioneer && product.views_count > 100 && conversionRate > 5
                const isLowConversion =
                  isProOrPioneer && product.views_count > 100 && conversionRate < 2
                return (
                  <div key={product.id} className="relative">
                    <SellerProductCard
                      product={product}
                      onTogglePublish={handleTogglePublish}
                      onDuplicate={handleDuplicate}
                      onDelete={handleDelete}
                      showTrendingBadge={isTrending}
                      showLowConversionBadge={isLowConversion}
                      trafficSource="direct"
                    />
                    <div className="absolute top-2 left-2 z-20">
                      <div className="bg-white/90 backdrop-blur-sm rounded p-0.5 shadow-sm">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => handleSelectProduct(product.id)}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="space-y-4">
              {/* List View Header with Select All */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Checkbox
                      checked={
                        filteredProducts.length > 0 &&
                        selectedProducts.size === filteredProducts.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">Select All</span>
                    <Separator orientation="vertical" className="h-4" />
                    <span className="text-sm text-muted-foreground">
                      {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {filteredProducts.map((product, index) => (
                <Card key={product.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row gap-4 p-6">
                      {/* Checkbox */}
                      <div className="flex items-start pt-1 sm:pt-0">
                        <Checkbox
                          checked={selectedProducts.has(product.id)}
                          onCheckedChange={() => handleSelectProduct(product.id)}
                        />
                      </div>

                      {/* Thumbnail */}
                      <div className="w-full sm:w-32 h-48 sm:h-32 bg-muted rounded-lg flex-shrink-0 overflow-hidden">
                        {product.cover_image_url ? (
                          <img
                            src={product.cover_image_url}
                            alt={product.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <Skeleton className="w-full h-full" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 space-y-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <CardTitle className="text-lg">{product.title}</CardTitle>
                            <Badge
                              className={`${STATUS_COLORS[product.status]} text-white`}
                            >
                              {STATUS_LABELS[product.status]}
                            </Badge>
                          </div>
                          <CardDescription>
                            {product.grade.name} • {product.subject.name} •{' '}
                            {product.product_type.replace('_', ' ')}
                          </CardDescription>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        </div>

                        <Separator />

                        {/* Stats */}
                        <div className="flex flex-wrap items-center gap-4 text-sm">
                          <div className="flex items-center gap-1">
                            <span className="font-semibold text-lg text-orange-600">
                              ₱{product.price.toFixed(2)}
                            </span>
                          </div>
                          <Separator orientation="vertical" className="h-4" />
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Eye className="h-4 w-4" />
                            <span>{product.views_count.toLocaleString()}</span>
                          </div>
                          <Separator orientation="vertical" className="h-4" />
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <ShoppingBag className="h-4 w-4" />
                            <span>{product.sales_count.toLocaleString()}</span>
                          </div>
                          {product.avg_rating && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <div className="flex items-center gap-1.5">
                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                <span className="font-medium">
                                  {product.avg_rating.toFixed(1)}
                                </span>
                                <span className="text-muted-foreground">
                                  ({product.reviews_count})
                                </span>
                              </div>
                            </>
                          )}
                          {product.conversion_rate && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <div className="text-muted-foreground">
                                📊 {product.conversion_rate.toFixed(1)}%
                              </div>
                            </>
                          )}
                        </div>

                        <Separator />

                        {/* Actions */}
                        <div className="flex flex-wrap gap-2">
                          <Link href={`/products/${product.id}`}>
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1.5" />
                              View
                            </Button>
                          </Link>
                          <Link href={`/shop/products/${product.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4 mr-1.5" />
                              Edit
                            </Button>
                          </Link>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDuplicate(product.id)}
                          >
                            <Copy className="h-4 w-4 mr-1.5" />
                            Duplicate
                          </Button>
                          {product.status !== 'deleted' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4 mr-1.5" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  {index < filteredProducts.length - 1 && (
                    <Separator className="mx-6" />
                  )}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </PullToRefresh>
  )
}
