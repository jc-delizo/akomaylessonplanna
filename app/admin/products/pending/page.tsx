import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Eye, Download } from 'lucide-react'
import Image from 'next/image'

async function getPendingProducts(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  // Query pending products directly from Supabase
  const { data: pendingProducts, error } = await supabase
    .from('products')
    .select(`
      *,
      seller:users!products_seller_id_fkey(
        id,
        first_name,
        last_name,
        username,
        avatar_url,
        created_at,
        is_verified_teacher
      ),
      grade:grades!products_grade_id_fkey(id, name),
      subject:subjects!products_subject_id_fkey(id, name)
    `)
    .eq('status', 'pending_review')
    .order('created_at', { ascending: true }) // Oldest first (FCFS)

  if (error) {
    console.error('Error fetching pending products:', error)
    throw new Error('Failed to fetch pending products')
  }

  // Calculate priority badges and submission counts
  const productsWithMetadata = await Promise.all(
    (pendingProducts || []).map(async (product) => {
      const submittedTime = new Date(product.created_at)
      const now = new Date()
      const hoursSinceSubmission = (now.getTime() - submittedTime.getTime()) / 3600000

      // Get seller's product count (to determine if this is one of first 3)
      const { count: sellerProductCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', product.seller_id)
        .in('status', ['published', 'pending_review'])

      // Get submission count (how many times this product was submitted)
      const { count: submissionCount } = await supabase
        .from('product_updates')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', product.id)

      return {
        ...product,
        hoursSinceSubmission,
        priority: hoursSinceSubmission > 48 ? 'high' : hoursSinceSubmission > 24 ? 'medium' : 'low',
        productNumber: (sellerProductCount || 0) + 1, // 1 of 3
        submissionCount: (submissionCount || 0) + 1,
      }
    })
  )

  return productsWithMetadata
}

export default async function PendingProductsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/products/pending')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const products = await getPendingProducts(supabase)

  const getTimeAgo = (hours: number) => {
    if (hours < 24) return `${Math.floor(hours)}h`
    return `${Math.floor(hours / 24)}d`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pending Product Reviews</h1>
        <p className="text-gray-600 mt-1">Review and approve/reject products (oldest first)</p>
      </div>

      {/* Oldest Product Alert */}
      {products?.length > 0 && (
        <Card className="p-4 bg-orange-50 border-orange-200">
          <div className="flex items-center gap-2">
            <span className="text-orange-700 font-medium">
              Oldest product: {getTimeAgo(products[0]?.hoursSinceSubmission || 0)} ago
            </span>
            {products[0]?.hoursSinceSubmission > 48 && (
              <Badge className="bg-red-100 text-red-700">Over 48h</Badge>
            )}
          </div>
        </Card>
      )}

      {/* Product Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {products?.length === 0 ? (
          <Card className="p-8 text-center col-span-2">
            <p className="text-gray-500">No pending products</p>
          </Card>
        ) : (
          products?.map((product: any) => {
            const seller = product.seller
            const timeAgo = getTimeAgo(product.hoursSinceSubmission)

            return (
              <Card key={product.id} className="p-6">
                <div className="flex gap-4">
                  {/* Cover Image */}
                  <div className="shrink-0">
                    {product.cover_image_url ? (
                      <Image
                        src={product.cover_image_url}
                        alt={product.title}
                        width={150}
                        height={200}
                        className="rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-[150px] h-[200px] bg-gray-200 rounded-lg flex items-center justify-center">
                        <span className="text-gray-400 text-sm">No image</span>
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{product.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {product.product_type?.replace('_', ' ')}
                          </Badge>
                          {product.priority === 'high' && (
                            <Badge className="bg-red-100 text-red-700 text-xs">
                              Over 48h
                            </Badge>
                          )}
                          {product.priority === 'medium' && (
                            <Badge className="bg-orange-100 text-orange-700 text-xs">
                              Over 24h
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Seller Info */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                        {seller?.avatar_url ? (
                          <img
                            src={seller.avatar_url}
                            alt={seller ? `${seller.first_name} ${seller.last_name || ''}`.trim() : 'Seller'}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-xs">{seller?.first_name?.[0]?.toUpperCase() || ''}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{seller ? `${seller.first_name} ${seller.last_name || ''}`.trim() : 'Seller'}</p>
                        <p className="text-xs text-gray-500">
                          Product #{product.productNumber} of 3 • {product.submissionCount} submission
                        </p>
                      </div>
                    </div>

                    {/* Product Details */}
                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                      <p>
                        <span className="font-medium">Grade:</span> {product.grade?.name || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Subject:</span> {product.subject?.name || 'N/A'}
                      </p>
                      <p>
                        <span className="font-medium">Price:</span> ₱{product.price?.toFixed(2)}
                      </p>
                      <p>
                        <span className="font-medium">Submitted:</span> {timeAgo} ago
                      </p>
                    </div>

                    {/* Description Preview */}
                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                        {product.description}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Eye className="h-4 w-4 mr-2" />
                        Preview
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        size="sm"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50"
                        size="sm"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
