import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFullName, getInitials } from '@/lib/utils/profile'

async function getBannedUsers(
  supabase: Awaited<ReturnType<typeof createClient>>
) {
  // Query banned users directly from Supabase
  const { data: users, error } = await supabase
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
    `)
    .eq('is_banned', true)
    .order('updated_at', { ascending: false })

  if (error) {
    console.error('Error fetching banned users:', error)
    throw new Error('Failed to fetch banned users')
  }

  return users || []
}

export default async function BannedUsersPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/users/banned')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const bannedUsers = await getBannedUsers(supabase)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Banned Users</h1>
        <p className="text-gray-600 mt-1">Manage suspended accounts</p>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">User</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Ban Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Banned Date</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bannedUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No banned users
                  </td>
                </tr>
              ) : (
                bannedUsers.map((user: any) => (
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
                      <p className="text-sm">{user.ban_reason || 'No reason provided'}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(user.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="outline" size="sm">
                        Unban
                      </Button>
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
