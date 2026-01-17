import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Megaphone, Calendar, Users } from 'lucide-react'
import Link from 'next/link'
import { headers } from 'next/headers'

async function getAnnouncements() {
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/announcements`, {
    cache: 'no-store',
    headers: {
      ...(cookieHeader && { cookie: cookieHeader }),
    },
  })
  if (!response.ok) {
    throw new Error('Failed to fetch announcements')
  }
  const data = await response.json()
  return data.announcements || []
}

export default async function AnnouncementsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/announcements')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const announcements = await getAnnouncements()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-700">Scheduled</Badge>
      case 'draft':
        return <Badge variant="outline">Draft</Badge>
      case 'expired':
        return <Badge className="bg-gray-100 text-gray-700">Expired</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-700">Urgent</Badge>
      case 'important':
        return <Badge className="bg-orange-100 text-orange-700">Important</Badge>
      default:
        return <Badge variant="outline">Normal</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Announcements</h1>
          <p className="text-gray-600 mt-1">Create and manage platform announcements</p>
        </div>
        <Link href="/admin/announcements/create">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Create Announcement
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-sm text-gray-600">Total Sent</p>
          <p className="text-2xl font-bold mt-1">{announcements?.length || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Active Now</p>
          <p className="text-2xl font-bold mt-1">
            {announcements?.filter((a: any) => a.status === 'active').length || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Scheduled</p>
          <p className="text-2xl font-bold mt-1">
            {announcements?.filter((a: any) => a.status === 'scheduled').length || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-gray-600">Drafts</p>
          <p className="text-2xl font-bold mt-1">
            {announcements?.filter((a: any) => a.status === 'draft').length || 0}
          </p>
        </Card>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {announcements?.length === 0 ? (
          <Card className="p-8 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500 mb-4">No announcements yet</p>
            <Link href="/admin/announcements/create">
              <Button>Create First Announcement</Button>
            </Link>
          </Card>
        ) : (
          announcements?.map((announcement: any) => (
            <Card key={announcement.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(announcement.status)}
                    {getPriorityBadge(announcement.priority)}
                    <Badge variant="outline" className="capitalize">
                      {announcement.type?.replace('_', ' ')}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{announcement.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                    {announcement.message}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {typeof announcement.target_audience === 'object'
                        ? announcement.target_audience.basic || 'All'
                        : announcement.target_audience || 'All'}
                    </span>
                    {announcement.scheduled_for && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(announcement.scheduled_for).toLocaleString()}
                      </span>
                    )}
                    {announcement.sent_at && (
                      <span>Sent: {new Date(announcement.sent_at).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {announcement.status === 'draft' && (
                  <Button variant="outline" size="sm">
                    Edit
                  </Button>
                )}
                {announcement.status === 'active' && (
                  <Button variant="outline" size="sm" className="text-red-600">
                    Expire Now
                  </Button>
                )}
                {announcement.status === 'draft' && (
                  <Button variant="outline" size="sm" className="text-red-600">
                    Delete
                  </Button>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
