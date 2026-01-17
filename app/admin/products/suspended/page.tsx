import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Image from 'next/image'
import { Eye, RotateCcw } from 'lucide-react'

async function getSuspendedProducts(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  // Query suspended products directly from Supabase
  const { data: products, error } = await supabase
    .from('products')
    .select(`
      id,
      title,
      description,
      price,
      status,
      suspension_reason,
      views_count,
      sales_count,
      avg_rating,
      reviews_count,
      created_at,
      updated_at,
      seller:users!products_seller_id_fkey(
        id,
        name,
        username,
        avatar_url,
        email
      ),
      grade:grades!products_grade_id_fkey(
        id,
        name
      ),
      subject:subjects!products_subject_id_fkey(
        id,
        name
      )
    `)
    .eq('status', 'suspended')
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching suspended products:', error)
    throw new Error('Failed to fetch suspended products')
  }

  return products || []
}

export default async function SuspendedProductsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/products/suspended')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const suspendedProducts = await getSuspendedProducts(supabase)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Suspended Products</h1>
        <p className="text-gray-600 mt-1">Manage suspended products</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Seller</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Suspension Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Suspended Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {suspendedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                    No suspended products
                  </td>
                </tr>
              ) : (
                suspendedProducts.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="shrink-0">
                          {product.cover_image_url ? (
                            <Image
                              src={product.cover_image_url}
                              alt={product.title}
                              width={60}
                              height={60}
                              className="rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-[60px] h-[60px] bg-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{product.title}</p>
                          <p className="text-sm text-gray-500 line-clamp-1">{product.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-gray-100 text-gray-700">Suspended</Badge>
                            <span className="text-xs text-gray-500">
                              {product.grade?.name} • {product.subject?.name}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                          {product.seller?.avatar_url ? (
                            <img
                              src={product.seller.avatar_url}
                              alt={product.seller.name}
                              className="w-8 h-8 rounded-full"
                            />
                          ) : (
                            <span className="text-xs">{product.seller?.name?.[0]?.toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{product.seller?.name}</p>
                          <p className="text-xs text-gray-500">{product.seller?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-sm">{product.suspension_reason || 'No reason provided'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(product.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                        <Button variant="outline" size="sm">
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Reinstate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
