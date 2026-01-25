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
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
        <div className="flex items-center justify-between gap-3">
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
          <Link href="/shop/products/new">
            <Button className="hidden sm:flex">
              <Plus className="h-4 w-4 mr-2" />
              Create Product
            </Button>
          </Link>
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
                {filterStatus === 'all' && (
                  <div className="pt-4">
                    <Link href="/shop/products/new">
                      <Button size="lg" className="gap-2">
                        <Plus className="h-4 w-4" />
                        Create Your First Product
                      </Button>
                    </Link>
                  </div>
                )}
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
                <Card
                  key={product.id}
                  className="group overflow-hidden h-full flex flex-col hover:shadow-lg transition-all duration-200 border-0 shadow-sm"
                >
                  {/* Image Section */}
                  <CardHeader className="p-0 relative">
                    <div className="relative aspect-[4/3] bg-muted overflow-hidden rounded-t-lg">
                      {product.cover_image_url ? (
                        <img
                          src={product.cover_image_url}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-muted">
                          <Skeleton className="w-full h-full" />
                        </div>
                      )}

                      {/* Checkbox for bulk selection */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-background/80 backdrop-blur-sm rounded p-0.5">
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => handleSelectProduct(product.id)}
                          />
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        <Badge
                          className={`${STATUS_COLORS[product.status]} text-white text-xs shadow-sm`}
                        >
                          {STATUS_LABELS[product.status]}
                        </Badge>
                      </div>

                      {/* Trending/Low Conversion Badges */}
                      {isTrending && (
                        <div className="absolute bottom-2 left-2 z-10">
                          <Badge className="bg-orange-500 text-white text-xs shadow-sm">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        </div>
                      )}
                      {isLowConversion && (
                        <div className="absolute bottom-2 left-2 z-10">
                          <Badge className="bg-yellow-500 text-white text-xs shadow-sm">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Low conversion
                          </Badge>
                        </div>
                      )}
                    </div>
                  </CardHeader>

                  {/* Info Section */}
                  <CardContent className="flex-1 flex flex-col p-4 space-y-3">
                    {/* Product Title */}
                    <div className="space-y-1.5">
                      <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                        {product.title}
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        {product.grade.name} • {product.subject.name}
                      </p>
                    </div>

                    <Separator />

                    {/* Price */}
                    <div>
                      <p className="text-xl font-bold text-orange-600">
                        ₱{product.price.toFixed(2)}
                      </p>
                    </div>

                    {/* Rating and Sales */}
                    {product.avg_rating ? (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                          <span className="font-medium">{product.avg_rating.toFixed(1)}</span>
                          {product.reviews_count > 0 && (
                            <span className="text-muted-foreground">
                              ({product.reviews_count})
                            </span>
                          )}
                        </div>
                        {product.sales_count > 0 && (
                          <span className="text-muted-foreground">
                            {product.sales_count.toLocaleString()} sales
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">No reviews yet</span>
                        {product.sales_count > 0 && (
                          <span className="text-muted-foreground">
                            {product.sales_count.toLocaleString()} sales
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats - Views */}
                    {product.views_count > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Eye className="h-3 w-3" />
                        <span>{product.views_count.toLocaleString()} views</span>
                        {conversionRate > 0 && (
                          <>
                            <Separator orientation="vertical" className="h-3" />
                            <span>📊 {conversionRate.toFixed(1)}%</span>
                          </>
                        )}
                      </div>
                    )}
                  </CardContent>

                  {/* Actions */}
                  <CardFooter className="p-4 pt-0 gap-2">
                    <Link href={`/shop/products/${product.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-3 w-3 mr-1.5" />
                        Edit
                      </Button>
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleTogglePublish(product.id, product.status)}
                        >
                          {product.status === 'published' ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Publish
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(product.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(product.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardFooter>
                </Card>
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
                  {filterStatus === 'all' && (
                    <div className="pt-4">
                      <Link href="/shop/products/new">
                        <Button size="lg" className="gap-2">
                          <Plus className="h-4 w-4" />
                          Create Your First Product
                        </Button>
                      </Link>
                    </div>
                  )}
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
                  <Card
                    key={product.id}
                    className="overflow-hidden h-full flex flex-col group bg-white hover:shadow-lg transition-shadow duration-200 rounded-lg p-0"
                  >
                    {/* Image Section - Clean and Simple */}
                    <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                      {product.cover_image_url ? (
                        <Image
                          src={product.cover_image_url}
                          alt={`${product.title} - ${product.grade.name} ${product.subject.name} lesson plan`}
                          fill
                          className="object-cover"
                          loading="lazy"
                          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                          <svg
                            className="w-12 h-12"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Checkbox for bulk selection - Top Left */}
                      <div className="absolute top-2 left-2 z-10">
                        <div className="bg-white/90 backdrop-blur-sm rounded p-0.5 shadow-sm">
                          <Checkbox
                            checked={selectedProducts.has(product.id)}
                            onCheckedChange={() => handleSelectProduct(product.id)}
                          />
                        </div>
                      </div>

                      {/* Status Badge - Top Right */}
                      <div className="absolute top-2 right-2 z-10">
                        <Badge
                          className={`${STATUS_COLORS[product.status]} text-white text-xs shadow-sm`}
                        >
                          {STATUS_LABELS[product.status]}
                        </Badge>
                      </div>

                      {/* Trending/Low Conversion Badges - Bottom Left */}
                      {isTrending && (
                        <div className="absolute bottom-2 left-2 z-10">
                          <Badge className="bg-orange-500 text-white text-xs shadow-sm">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Trending
                          </Badge>
                        </div>
                      )}
                      {isLowConversion && (
                        <div className="absolute bottom-2 left-2 z-10">
                          <Badge className="bg-yellow-500 text-white text-xs shadow-sm">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Low conversion
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Info Section - Clean Typography Hierarchy */}
                    <div className="px-3 pt-1.5 pb-2 flex-1 flex flex-col bg-white">
                      {/* Product Title - Large and Bold (Primary Focus) */}
                      <h3 className="font-bold text-sm leading-tight mb-0.5 line-clamp-2 text-gray-900">
                        {product.title}
                      </h3>

                      {/* Grade and Subject - Secondary Info */}
                      <p className="text-xs text-gray-500 mb-0.5">
                        {product.grade.name} • {product.subject.name}
                      </p>

                      {/* Price - Prominent Display */}
                      <p className="text-lg font-bold text-orange-600 mb-0.5">
                        ₱{product.price.toFixed(2)}
                      </p>

                      {/* Rating and Sales - Compact */}
                      {product.avg_rating ? (
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="flex items-center gap-1">
                            <svg
                              className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-medium text-gray-700">
                              {product.avg_rating.toFixed(1)}
                            </span>
                            {product.reviews_count > 0 && (
                              <span className="text-xs text-gray-500">
                                ({product.reviews_count})
                              </span>
                            )}
                          </div>
                          {product.sales_count > 0 && (
                            <span className="text-xs text-gray-500">
                              {product.sales_count.toLocaleString()} sales
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center justify-between mb-0.5">
                          <div className="text-xs text-gray-400">No reviews yet</div>
                          {product.sales_count > 0 && (
                            <span className="text-xs text-gray-500">
                              {product.sales_count.toLocaleString()} sales
                            </span>
                          )}
                        </div>
                      )}

                      {/* Stats - Views */}
                      {product.views_count > 0 && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                          <Eye className="h-3 w-3" />
                          <span>{product.views_count.toLocaleString()} views</span>
                          {conversionRate > 0 && (
                            <span className="ml-1.5">📊 {conversionRate.toFixed(1)}%</span>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-1 mt-1">
                        <Link href={`/shop/products/${product.id}/edit`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full h-7 text-xs">
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                              <MoreVertical className="h-3.5 w-3.5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleTogglePublish(product.id, product.status)}
                            >
                              {product.status === 'published' ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Unpublish
                                </>
                              ) : (
                                <>
                                  <Send className="h-4 w-4 mr-2" />
                                  Publish
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDuplicate(product.id)}>
                              <Copy className="h-4 w-4 mr-2" />
                              Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(product.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </Card>
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
