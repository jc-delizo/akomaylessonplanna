import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getFullName, getInitials } from '@/lib/utils/profile'
import { ArrowLeft, Edit, Package, Flag, FileText } from 'lucide-react'
import { UserDetailClient } from './user-detail-client'

async function getUserDetail(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !user) return null

  const [adminNotes, verification] = await Promise.all([
    supabase
      .from('admin_notes')
      .select(`
        *,
        admin:users!admin_notes_admin_id_fkey(id, first_name, last_name, email)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('teacher_id_verifications')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  return {
    user,
    adminNotes: adminNotes.data || [],
    pendingVerification: verification.data,
  }
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: userId } = await params
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/users/' + userId)
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const data = await getUserDetail(supabase, userId)
  if (!data) {
    notFound()
  }

  const { user, adminNotes, pendingVerification } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/users">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">User Detail</h1>
          <p className="text-muted-foreground">View and manage user</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Section */}
        <Card className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={getFullName(user)}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <span className="text-xl font-medium">
                    {getInitials(user.first_name || '', user.last_name || '')}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-semibold">{getFullName(user)}</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
                {user.username && (
                  <p className="text-sm text-muted-foreground">@{user.username}</p>
                )}
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {user.role}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {user.subscription_tier}
                  </Badge>
                  {user.is_verified_teacher && (
                    <Badge className="bg-green-100 text-green-700">Verified</Badge>
                  )}
                  {user.is_banned && (
                    <Badge className="bg-red-100 text-red-700">Banned</Badge>
                  )}
                </div>
              </div>
            </div>
            <UserDetailClient
              user={user}
              adminNotes={adminNotes}
              pendingVerification={pendingVerification}
            />
          </div>
          {user.bio && (
            <p className="text-sm text-muted-foreground mt-2">{user.bio}</p>
          )}
        </Card>

        {/* Quick Links */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href={`/marketplace/browse?seller=${user.id}`}>
                <Package className="h-4 w-4 mr-2" />
                View Products
              </Link>
            </Button>
            <Button variant="outline" className="w-full justify-start" asChild>
              <Link href="/admin/reports">
                <Flag className="h-4 w-4 mr-2" />
                View Reports
              </Link>
            </Button>
          </div>
        </Card>
      </div>

      {/* Admin Notes Section */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Admin Notes</h3>
        <UserDetailClient
          user={user}
          adminNotes={adminNotes}
          pendingVerification={pendingVerification}
          notesOnly
        />
      </Card>
    </div>
  )
}
