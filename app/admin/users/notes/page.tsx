import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { getFullName, getInitials } from '@/lib/utils/profile'

export default async function AdminNotesPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/users/notes')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  // Get all admin notes with user info
  const { data: notes } = await supabase
    .from('admin_notes')
    .select(`
      *,
      user:users!admin_notes_user_id_fkey(id, first_name, last_name, email, avatar_url),
      admin:users!admin_notes_admin_id_fkey(id, first_name, last_name, email),
      mentioned_admin:users!admin_notes_mentioned_admin_fkey(id, first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Notes</h1>
        <p className="text-gray-600 mt-1">Internal communication and user notes</p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by user name, email, or note content..."
            className="pl-10"
          />
        </div>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        {notes?.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No admin notes yet</p>
          </Card>
        ) : (
          notes?.map((note: any) => (
            <Card key={note.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  {note.user?.avatar_url ? (
                    <img
                      src={note.user.avatar_url}
                      alt={note.user ? getFullName(note.user) : 'User'}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <span className="text-sm font-medium">
                      {note.user ? getInitials(note.user.first_name || '', note.user.last_name || '') : ''}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{note.user ? getFullName(note.user) : 'Unknown'}</p>
                    <span className="text-sm text-gray-500">•</span>
                    <p className="text-sm text-gray-500">
                      Note by {note.admin ? getFullName(note.admin) : 'Unknown'}
                    </p>
                    {note.is_mention && note.mentioned_admin && (
                      <>
                        <span className="text-sm text-gray-500">•</span>
                        <span className="text-sm text-purple-600">
                          @{getFullName(note.mentioned_admin)}
                        </span>
                      </>
                    )}
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{note.note}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(note.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
