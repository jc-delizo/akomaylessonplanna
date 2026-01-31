'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Edit } from 'lucide-react'
import { getFullName, getInitials } from '@/lib/utils/profile'
import { UserEditModal } from '@/components/admin/user-edit-modal'
import { BanUserDialog } from '@/components/admin/ban-user-dialog'
import { UnbanUserDialog } from '@/components/admin/unban-user-dialog'
import { AdminNoteForm } from '@/components/admin/admin-note-form'
import { VerificationActions } from '@/components/admin/verification-actions'

interface UserDetailClientProps {
  user: {
    id: string
    first_name: string
    last_name: string
    username: string | null
    bio: string | null
    subscription_tier: string
    is_banned: boolean
    ban_reason: string | null
  }
  adminNotes: Array<{
    id: string
    note: string
    created_at: string
    admin?: { first_name?: string; last_name?: string }
  }>
  pendingVerification?: { id: string } | null
  notesOnly?: boolean
}

export function UserDetailClient({
  user,
  adminNotes,
  pendingVerification,
  notesOnly = false,
}: UserDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false)

  if (notesOnly) {
    return (
      <div className="space-y-4">
        <AdminNoteForm userId={user.id} />
        <div className="space-y-2">
          {adminNotes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admin notes yet</p>
          ) : (
            adminNotes.map((note) => (
              <div
                key={note.id}
                className="border rounded-md p-3 text-sm"
              >
                <p>{note.note}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {note.admin ? getFullName({ first_name: note.admin.first_name || '', last_name: note.admin.last_name || '' }) : 'Unknown'} •{' '}
                  {new Date(note.created_at).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <div className="flex gap-2">
        {user.is_banned ? (
          <UnbanUserDialog userId={user.id} />
        ) : (
          <BanUserDialog userId={user.id} />
        )}
      </div>
      {pendingVerification && (
        <VerificationActions
          userId={user.id}
          verificationId={pendingVerification.id}
        />
      )}
      <UserEditModal
        user={user}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
    </div>
  )
}
