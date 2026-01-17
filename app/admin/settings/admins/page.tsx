import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, User, Shield } from 'lucide-react'

async function getAdmins() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/admins`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch admins')
  }
  return response.json()
}

export default async function AdminManagementPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/settings/admins')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser || adminUser.admin_role !== 'super_admin') {
    redirect('/admin')
  }

  const { admins } = await getAdmins()

  const getRoleBadge = (role: string) => {
    const roleColors: Record<string, string> = {
      super_admin: 'bg-purple-100 text-purple-700',
      moderator: 'bg-blue-100 text-blue-700',
      content_manager: 'bg-green-100 text-green-700',
    }
    return (
      <Badge className={roleColors[role] || 'bg-gray-100 text-gray-700'}>
        {role.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Admin Management</h1>
          <p className="text-gray-600 mt-1">Manage admin accounts and roles</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Admin
        </Button>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Admin</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Role</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Last Active</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {admins?.map((admin: any) => (
                <tr key={admin.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        {admin.avatar_url ? (
                          <img
                            src={admin.avatar_url}
                            alt={admin.name}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <User className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{admin.name}</p>
                        <p className="text-xs text-gray-500">
                          Admin since {new Date(admin.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">{admin.email}</td>
                  <td className="px-4 py-3">{getRoleBadge(admin.admin_role)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {admin.lastActive
                      ? new Date(admin.lastActive).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Edit Role
                      </Button>
                      {admin.admin_role !== 'super_admin' && (
                        <Button variant="outline" size="sm" className="text-red-600">
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
