import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { AdminNotesClient } from './admin-notes-client'

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

  const { data: notes } = await createAdminClient()
    .from('admin_notes')
    .select(`
      *,
      user:users!admin_notes_user_id_fkey(id, first_name, last_name, email, avatar_url),
      admin:users!admin_notes_admin_id_fkey(id, first_name, last_name, email),
      mentioned_admin:users!admin_notes_mentioned_admin_fkey(id, first_name, last_name, email)
    `)
    .order('created_at', { ascending: false })
    .limit(50)

  type NoteWithUser = { id: string; note: string; created_at: string; user?: { id: string; first_name: string; last_name: string; email: string }; admin?: { first_name?: string; last_name?: string } }
  const notesWithUser: NoteWithUser[] = (notes || []).map((n: Record<string, unknown>) => ({
    ...n,
    user: (n.user as { id: string; first_name: string; last_name: string; email: string }) || { id: n.user_id as string, first_name: '', last_name: '', email: '' },
  })) as NoteWithUser[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Notes</h1>
        <p className="text-muted-foreground mt-1">Internal communication and user notes</p>
      </div>
      <AdminNotesClient initialNotes={notesWithUser} />
    </div>
  )
}
