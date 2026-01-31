'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreHorizontal, Eye, Edit, StickyNote, Ban } from 'lucide-react'
import { BanUserDialog } from '@/components/admin/ban-user-dialog'
import { UnbanUserDialog } from '@/components/admin/unban-user-dialog'
import { UserEditModal } from '@/components/admin/user-edit-modal'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AdminNoteForm } from '@/components/admin/admin-note-form'

interface UsersTableActionsProps {
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
}

export function UsersTableActions({ user }: UsersTableActionsProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)
  const [banOpen, setBanOpen] = useState(false)
  const [unbanOpen, setUnbanOpen] = useState(false)

  return (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" asChild>
        <Link href={`/admin/users/${user.id}`}>
          <Eye className="h-4 w-4 mr-1" />
          View
        </Link>
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setNoteOpen(true)}>
            <StickyNote className="h-4 w-4 mr-2" />
            Add Note
          </DropdownMenuItem>
          {user.is_banned ? (
            <DropdownMenuItem onClick={() => setUnbanOpen(true)}>
              <Ban className="h-4 w-4 mr-2" />
              Unban
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onClick={() => setBanOpen(true)} className="text-red-600">
              <Ban className="h-4 w-4 mr-2" />
              Ban
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {!user.is_banned && (
        <BanUserDialog
          userId={user.id}
          open={banOpen}
          onOpenChange={setBanOpen}
        />
      )}
      {user.is_banned && (
        <UnbanUserDialog
          userId={user.id}
          open={unbanOpen}
          onOpenChange={setUnbanOpen}
        />
      )}
      <UserEditModal
        user={user}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Admin Note</DialogTitle>
          </DialogHeader>
          <AdminNoteForm
            userId={user.id}
            onSuccess={() => setNoteOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
