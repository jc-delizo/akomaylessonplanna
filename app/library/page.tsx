'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Download, Star, Search, ShoppingBag } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface LibraryItem {
  id: string
  product_id: string
  purchased_at: string
  download_count: number
  last_downloaded_at?: string
  product: {
    id: string
    title: string
    cover_image_url?: string
    seller: {
      id: string
      name: string
      username: string
    }
  }
  rating?: number
}

export default function LibraryPage() {
  const router = useRouter()
  const [libraryItems, setLibraryItems] = useState<LibraryItem[]>([])
  const [filteredItems, setFilteredItems] = useState<LibraryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<'all' | 'recent' | 'downloaded'>('all')
  const [downloading, setDownloading] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    loadLibrary()
  }, [])

  useEffect(() => {
    filterItems()
  }, [libraryItems, searchQuery, filter])

  const loadLibrary = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/library')
      if (!response.ok) {
        throw new Error('Failed to load library')
      }

      const data = await response.json()
      setLibraryItems(data.items || [])
    } catch (error) {
      console.error('Error loading library:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterItems = () => {
    let filtered = [...libraryItems]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter((item) =>
        item.product.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply filter
    if (filter === 'recent') {
      filtered = filtered.sort(
        (a, b) =>
          new Date(b.purchased_at).getTime() - new Date(a.purchased_at).getTime()
      )
    } else if (filter === 'downloaded') {
      filtered = filtered
        .filter((item) => item.download_count > 0)
        .sort((a, b) => b.download_count - a.download_count)
    }

    setFilteredItems(filtered)
  }

  const handleDownload = async (productId: string) => {
    setDownloading(productId)
    try {
      const response = await fetch(`/api/library/${productId}/download`)
      if (!response.ok) {
        throw new Error('Failed to download')
      }

      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition')
      let filename = `product-${productId}.pdf`
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
        if (filenameMatch) {
          filename = filenameMatch[1]
        }
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      // Reload library to update download count
      loadLibrary()
    } catch (error) {
      console.error('Error downloading:', error)
      alert('Failed to download. Please try again.')
    } finally {
      setDownloading(null)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your library...</p>
          </div>
        </div>
      </div>
    )
  }

  if (libraryItems.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">My Library</h1>
        <Card className="p-12 text-center">
          <ShoppingBag className="w-24 h-24 mx-auto mb-4 text-gray-400" />
          <h2 className="text-2xl font-semibold mb-2">You haven't purchased anything yet</h2>
          <p className="text-gray-600 mb-6">
            Start browsing our collection of quality lesson plans and resources!
          </p>
          <Button asChild>
            <Link href="/marketplace">Browse Products</Link>
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">
        My Library ({libraryItems.length} {libraryItems.length === 1 ? 'item' : 'items'})
      </h1>

      {/* Search and Filter */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            placeholder="Search your library..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'recent' ? 'default' : 'outline'}
            onClick={() => setFilter('recent')}
          >
            Recently Purchased
          </Button>
          <Button
            variant={filter === 'downloaded' ? 'default' : 'outline'}
            onClick={() => setFilter('downloaded')}
          >
            Most Downloaded
          </Button>
        </div>
      </div>

      {/* Library Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200 flex flex-col">
            {/* Product Image */}
            <Link href={`/products/${item.product.id}`} className="relative aspect-[4/3] bg-gray-100">
              {item.product.cover_image_url ? (
                <img
                  src={item.product.cover_image_url}
                  alt={item.product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <svg
                    className="w-16 h-16"
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
            </Link>

            {/* Product Info */}
            <div className="p-4 flex-1 flex flex-col">
              <Link href={`/products/${item.product.id}`}>
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 hover:text-purple-600 transition-colors flex-1">
                  {item.product.title}
                </h3>
              </Link>
              <p className="text-sm text-gray-600 mb-2">
                Seller: {item.product.seller.name}
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Purchased: {new Date(item.purchased_at).toLocaleDateString()}
              </p>

              {/* Rating (if rated) */}
              {item.rating ? (
                <div className="flex items-center gap-1 mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= item.rating!
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              ) : (
                <Link
                  href={`/products/${item.product.id}#reviews`}
                  className="text-sm text-purple-600 hover:underline mb-4"
                >
                  Rate this Product
                </Link>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                <Button
                  className="flex-1"
                  onClick={() => handleDownload(item.product.id)}
                  disabled={downloading === item.product.id}
                >
                  <Download className="w-4 h-4 mr-2" />
                  {downloading === item.product.id ? 'Downloading...' : 'Download'}
                </Button>
              </div>

              {/* Download Count */}
              {item.download_count > 0 && (
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Downloaded {item.download_count} {item.download_count === 1 ? 'time' : 'times'}
                </p>
              )}
            </div>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && searchQuery && (
        <Card className="p-12 text-center mt-8">
          <p className="text-gray-600">No items found matching your search.</p>
        </Card>
      )}
    </div>
  )
}
