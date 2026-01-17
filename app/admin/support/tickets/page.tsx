import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, MessageSquare, Clock, CheckCircle } from 'lucide-react'

async function getSupportTickets() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const response = await fetch(`${baseUrl}/api/admin/support/tickets?status=open`, {
    cache: 'no-store',
  })
  if (!response.ok) {
    throw new Error('Failed to fetch support tickets')
  }
  return response.json()
}

export default async function SupportTicketsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/support/tickets')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const { tickets } = await getSupportTickets()

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge className="bg-yellow-100 text-yellow-700">Open</Badge>
      case 'in_progress':
        return <Badge className="bg-blue-100 text-blue-700">In Progress</Badge>
      case 'resolved':
        return <Badge className="bg-green-100 text-green-700">Resolved</Badge>
      case 'closed':
        return <Badge className="bg-gray-100 text-gray-700">Closed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700">High</Badge>
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-700">Medium</Badge>
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-700">Low</Badge>
      default:
        return <Badge variant="outline">{priority}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-gray-600 mt-1">Email-only support (users email support@, admins create tickets)</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      <div className="space-y-4">
        {tickets?.length === 0 ? (
          <Card className="p-8 text-center">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No open tickets</p>
          </Card>
        ) : (
          tickets?.map((ticket: any) => (
            <Card key={ticket.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getStatusBadge(ticket.status)}
                    {getPriorityBadge(ticket.priority)}
                    <Badge variant="outline" className="capitalize">
                      {ticket.category}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-1">{ticket.subject}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2 mb-2">{ticket.description}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>From: {ticket.user?.name || ticket.user?.email || 'Unknown'}</span>
                    {ticket.assigned_admin && (
                      <span>Assigned to: {ticket.assigned_admin.name}</span>
                    )}
                    <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                    {ticket.response_count > 0 && (
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {ticket.response_count} responses
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Ticket
                </Button>
                <Button variant="outline" size="sm">
                  Assign to Me
                </Button>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Resolve
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
