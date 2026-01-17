'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { PullToRefresh } from '@/components/dashboard/pull-to-refresh'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { GlareButton } from '@/components/ui/glare-button'
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
} from 'lucide-react'
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

  // Load view preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem('products-view-mode') as ViewMode
    if (savedView === 'grid' || savedView === 'list') {
      setViewMode(savedView)
    }
  }, [])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your products...</p>
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
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Shop</h1>
        <p className="text-gray-600 mt-1">Manage your shop</p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded text-red-600">
          {error}
        </div>
      )}

      {/* Filters and View Toggle */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        {/* Filter tabs */}
        <div className="flex gap-2 overflow-x-auto flex-1">
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-4 py-2 rounded whitespace-nowrap ${
              filterStatus === 'all'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All ({products.length})
          </button>
          {['draft', 'pending_review', 'published', 'rejected', 'suspended'].map((status) => {
            const count = products.filter((p) => p.status === status).length
            return (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded whitespace-nowrap ${
                  filterStatus === status
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {STATUS_LABELS[status]} ({count})
              </button>
            )
          })}
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-2">
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
      </div>

      {/* Bulk Actions Bar */}
      {selectedProducts.size > 0 && (
        <Card className="p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-purple-900">
              {selectedProducts.size} product{selectedProducts.size !== 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('publish')}
              >
                Publish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('unpublish')}
              >
                Unpublish
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('draft')}
              >
                Move to Draft
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleBulkAction('delete')}
                className="text-red-600 hover:text-red-700"
              >
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
        </Card>
      )}

      {/* Products Display */}
      {filteredProducts.length === 0 ? (
        <Card className="p-12 text-center">
          <svg
            className="mx-auto w-24 h-24 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-xl font-semibold mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {filterStatus === 'all'
              ? 'Get started by uploading your first product!'
              : `No products with status "${STATUS_LABELS[filterStatus]}"`}
          </p>
          {filterStatus === 'all' && (
            <GlareButton>
              <Link href="/shop/products/new">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Upload Product
                </Button>
              </Link>
            </GlareButton>
          )}
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
              <Card key={product.id} className="overflow-hidden h-full flex flex-col group bg-white hover:shadow-lg transition-shadow duration-200 rounded-lg p-0">
                {/* Image Section */}
                <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
                  {product.cover_image_url ? (
                    <img
                      src={product.cover_image_url}
                      alt={product.title}
                      className="w-full h-full object-cover"
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
                  
                  {/* Checkbox for bulk selection */}
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox
                      checked={selectedProducts.has(product.id)}
                      onCheckedChange={() => handleSelectProduct(product.id)}
                      className="bg-white"
                    />
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-2 right-2 z-10">
                    <Badge className={`${STATUS_COLORS[product.status]} text-white text-xs`}>
                      {STATUS_LABELS[product.status]}
                    </Badge>
                  </div>

                  {/* Trending/Low Conversion Badges */}
                  {isTrending && (
                    <div className="absolute bottom-2 left-2 z-10">
                      <Badge className="bg-orange-500 text-white text-xs">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    </div>
                  )}
                  {isLowConversion && (
                    <div className="absolute bottom-2 left-2 z-10">
                      <Badge className="bg-yellow-500 text-white text-xs">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Low conversion
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="px-4 pt-0 pb-4 flex-1 flex flex-col bg-white">
                  {/* Product Title */}
                  <h3 className="font-bold text-base leading-tight mb-1 line-clamp-2 text-gray-900 min-h-[2.5rem]">
                    {product.title}
                  </h3>

                  {/* Grade and Subject */}
                  <p className="text-xs text-gray-500 mb-1.5">
                    {product.grade.name} • {product.subject.name}
                  </p>

                  {/* Price */}
                  <div className="mb-1.5">
                    <p className="text-xl font-bold text-orange-600">
                      ₱{product.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Rating and Sales */}
                  {product.avg_rating ? (
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1">
                        <svg
                          className="w-4 h-4 text-yellow-400 fill-yellow-400"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
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
                    <div className="flex items-center justify-between mb-1">
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
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <Eye className="h-3 w-3" />
                      <span>{product.views_count.toLocaleString()} views</span>
                      {conversionRate > 0 && (
                        <span className="ml-2">📊 {conversionRate.toFixed(1)}%</span>
                      )}
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex items-center gap-1 mt-auto">
                    <Link href={`/shop/products/${product.id}/edit`} className="flex-1">
                      <Button variant="outline" size="sm" className="w-full">
                        <Edit className="h-3 w-3 mr-1" />
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
                          className="text-red-600"
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
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <Checkbox
              checked={
                filteredProducts.length > 0 &&
                selectedProducts.size === filteredProducts.length
              }
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm text-gray-600">Select All</span>
          </div>

          {filteredProducts.map((product) => (
            <Card key={product.id} className="p-6">
              <div className="flex gap-6">
                {/* Checkbox */}
                <div className="flex items-center">
                  <Checkbox
                    checked={selectedProducts.has(product.id)}
                    onCheckedChange={() => handleSelectProduct(product.id)}
                  />
                </div>

                {/* Thumbnail */}
                <div className="w-32 h-32 bg-gray-100 rounded flex-shrink-0">
                  {product.cover_image_url ? (
                    <img
                      src={product.cover_image_url}
                      alt={product.title}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg
                        className="w-12 h-12"
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

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold">{product.title}</h3>
                        <Badge className={`${STATUS_COLORS[product.status]} text-white`}>
                          {STATUS_LABELS[product.status]}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        {product.grade.name} • {product.subject.name} •{' '}
                        {product.product_type.replace('_', ' ')}
                      </p>
                      <p className="text-gray-700 line-clamp-2">{product.description}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-4">
                    <div>
                      <span className="font-semibold">₱{product.price.toFixed(2)}</span>
                    </div>
                    <div>👁️ {product.views_count}</div>
                    <div>💰 {product.sales_count}</div>
                    {product.avg_rating && (
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                        {product.avg_rating.toFixed(1)} ({product.reviews_count})
                      </div>
                    )}
                    {product.conversion_rate && (
                      <div>📊 {product.conversion_rate.toFixed(1)}%</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Link href={`/products/${product.id}`}>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                    <Link href={`/shop/products/${product.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicate(product.id)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Duplicate
                    </Button>
                    {product.status !== 'deleted' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Delete
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      </div>
    </PullToRefresh>
  )
}
