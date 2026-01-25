import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Filter, Download } from 'lucide-react'
import { getFullName } from '@/lib/utils/profile'

async function getReviewHistory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  searchParams: Record<string, string>
) {
  const search = searchParams.search
  const status = searchParams.status
  const page = parseInt(searchParams.page || '1', 10)
  const limit = parseInt(searchParams.limit || '50', 10)
  const offset = (page - 1) * limit

  // Build query for products with review history
  // We'll show products that have been reviewed (status changed from pending_review)
  let query = supabase
    .from('products')
    .select(`
      id,
      title,
      status,
      rejection_reason,
      suspension_reason,
      review_count,
      created_at,
      updated_at,
      published_at,
      seller:users!products_seller_id_fkey(
        id,
        first_name,
        last_name,
        username,
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
    `, { count: 'exact' })

  // Only show products that have been reviewed (not in pending_review)
  query = query.neq('status', 'pending_review')

  // Search filter
  if (search) {
    query = query.or(`title.ilike.%${search}%`)
  }

  // Status filter
  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  // Pagination and ordering
  query = query
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: products, error, count } = await query

  if (error) {
    console.error('Error fetching review history:', error)
    throw new Error('Failed to fetch review history')
  }

  return {
    products: products || [],
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

function getStatusBadge(status: string) {
  const statusConfig: Record<string, { label: string; className: string }> = {
    published: { label: 'Approved', className: 'bg-green-100 text-green-700' },
    rejected: { label: 'Rejected', className: 'bg-red-100 text-red-700' },
    suspended: { label: 'Suspended', className: 'bg-gray-100 text-gray-700' },
    draft: { label: 'Draft', className: 'bg-blue-100 text-blue-700' },
  }

  const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-700' }
  return <Badge className={config.className}>{config.label}</Badge>
}

export default async function ReviewHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}) {
  // Await searchParams if it's a Promise (Next.js 15+)
  const resolvedSearchParams = searchParams instanceof Promise ? await searchParams : searchParams

  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/products/history')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  // Convert searchParams to string record
  const params: Record<string, string> = {}
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (value) {
      params[key] = Array.isArray(value) ? value[0] : value
    }
  })

  let products: any[] = []
  let pagination: any = null
  try {
    const result = await getReviewHistory(supabase, params)
    products = result.products || []
    pagination = result.pagination || null
  } catch (error) {
    console.error('Error fetching review history:', error)
    // Continue with empty products array instead of crashing
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Review History</h1>
          <p className="text-gray-600 mt-1">View all reviewed products</p>
        </div>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Search and Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by product title..."
              className="pl-10"
              defaultValue={params.search || ''}
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </Card>

      {/* Review History Table */}
      <Card>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Product</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Seller</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Category</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Review Count</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reviewed Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {products && products.length > 0 ? (
                products.map((product: any) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{product.title}</p>
                        <p className="text-sm text-gray-500">
                          {product.grade?.name} • {product.subject?.name}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">{product.seller ? getFullName(product.seller) : 'N/A'}</p>
                        <p className="text-xs text-gray-500">{product.seller?.email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.grade?.name || 'N/A'} • {product.subject?.name || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      {getStatusBadge(product.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {product.review_count || 0} review{product.review_count !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
                      <p className="truncate">
                        {product.rejection_reason || product.suspension_reason || 'N/A'}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.published_at
                        ? new Date(product.published_at).toLocaleDateString()
                        : new Date(product.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No review history found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} products
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={pagination.page === pagination.totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
