import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter, Download } from 'lucide-react'
import { getFullName, getInitials } from '@/lib/utils/profile'

async function getUsers(
  supabase: Awaited<ReturnType<typeof createClient>>,
  searchParams: Record<string, string>
) {
  const search = searchParams.search
  const role = searchParams.role
  const verification = searchParams.verification
  const tier = searchParams.tier
  const banned = searchParams.banned
  const signupDateFrom = searchParams.signupDateFrom
  const signupDateTo = searchParams.signupDateTo
  const page = parseInt(searchParams.page || '1', 10)
  const limit = parseInt(searchParams.limit || '50', 10)
  const offset = (page - 1) * limit

  // Build query
  let query = supabase
    .from('users')
    .select(`
      id,
      email,
      first_name,
      last_name,
      username,
      avatar_url,
      role,
      is_verified_teacher,
      subscription_tier,
      is_banned,
      ban_reason,
      created_at,
      updated_at
    `, { count: 'exact' })

  // Search filter
  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,username.ilike.%${search}%`
    )
  }

  // Role filter
  if (role) {
    query = query.eq('role', role)
  }

  // Verification filter
  if (verification === 'verified') {
    query = query.eq('is_verified_teacher', true)
  } else if (verification === 'unverified') {
    query = query.eq('is_verified_teacher', false)
  } else if (verification === 'pending') {
    query = query.eq('is_verified_teacher', false)
  }

  // Tier filter
  if (tier) {
    query = query.eq('subscription_tier', tier)
  }

  // Banned filter
  if (banned !== undefined && banned !== null && banned !== '') {
    query = query.eq('is_banned', banned === 'true')
  }

  // Signup date filters
  if (signupDateFrom) {
    query = query.gte('created_at', signupDateFrom)
  }
  if (signupDateTo) {
    query = query.lte('created_at', signupDateTo)
  }

  // Pagination and ordering
  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  const { data: users, error, count } = await query
  if (error) {
    console.error('Error fetching users:', error)
    throw new Error('Failed to fetch users')
  }

  // Get additional stats for each user
  const usersWithStats = await Promise.all(
    (users || []).map(async (user) => {
      // Get product count
      const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)
        .eq('status', 'published')

      // Get sales count (as seller)
      const { count: salesCount } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .eq('seller_id', user.id)

      return {
        ...user,
        productCount: productCount || 0,
        salesCount: salesCount || 0,
      }
    })
  )

  return {
    users: usersWithStats,
    pagination: {
      page,
      limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
    },
  }
}

export default async function AdminUsersPage({
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
    redirect('/login?redirect=/admin/users')
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
  let users: any[] = []
  let pagination: any = null
  try {
    const result = await getUsers(supabase, params)
    users = result.users || []
    pagination = result.pagination || null
  } catch (error) {
    console.error('Error fetching users:', error)
    // Continue with empty users array instead of crashing
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all platform users</p>
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
              placeholder="Search by name, email, username, PRC license..."
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

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Verification</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Tier</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Products</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Sales</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users && users.length > 0 ? (
                users.map((user: any) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={getFullName(user)} className="w-10 h-10 rounded-full" />
                        ) : (
                          <span className="text-sm font-medium">{getInitials(user.first_name || '', user.last_name || '')}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{getFullName(user)}</p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {user.role}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {user.is_verified_teacher ? (
                      <Badge className="bg-green-100 text-green-700">Verified</Badge>
                    ) : (
                      <Badge variant="outline">Unverified</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="capitalize">
                      {user.subscription_tier}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">{user.productCount || 0}</td>
                  <td className="px-4 py-3 text-sm">{user.salesCount || 0}</td>
                  <td className="px-4 py-3">
                    {user.is_banned ? (
                      <Badge className="bg-red-100 text-red-700">Banned</Badge>
                    ) : (
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    )}
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
                    No users found
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
              {pagination.total} users
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
