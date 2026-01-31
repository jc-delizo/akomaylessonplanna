'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { UserSelector } from '@/components/admin/user-selector'
import { AdminNoteForm } from '@/components/admin/admin-note-form'
import { getFullName, getInitials } from '@/lib/utils/profile'

interface User {
  id: string
  first_name: string
  last_name: string
  email: string
  avatar_url?: string
}

interface Note {
  id: string
  note: string
  created_at: string
  user?: User
  admin?: { first_name?: string; last_name?: string }
}

interface AdminNotesClientProps {
  initialNotes: Note[]
}

export function AdminNotesClient({ initialNotes }: AdminNotesClientProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [notes, setNotes] = useState<Note[]>(initialNotes)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!selectedUser) {
      setNotes(initialNotes)
      return
    }
    fetch(`/api/admin/users/${selectedUser.id}/admin-notes`)
      .then((res) => res.json())
      .then((data) => {
        if (data.notes) {
          setNotes(data.notes.map((n: { admin_id: string; admin: unknown }) => ({
            ...n,
            user: selectedUser,
          })))
        }
      })
      .catch(() => setNotes([]))
  }, [selectedUser, initialNotes])

  const filteredNotes = searchQuery.trim()
    ? notes.filter(
        (n) =>
          (n.user && (getFullName(n.user).toLowerCase().includes(searchQuery.toLowerCase()) ||
            (n.user.email || '').toLowerCase().includes(searchQuery.toLowerCase()))) ||
          (n.note || '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : notes

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <UserSelector
          onSelect={(u) => setSelectedUser(u)}
          placeholder="Search and select user to view/add notes..."
        />
        {selectedUser && (
          <div className="mt-4 p-3 bg-muted rounded-md">
            <p className="text-sm font-medium">
              Viewing notes for {getFullName(selectedUser)} ({selectedUser.email})
            </p>
            <AdminNoteForm
              userId={selectedUser.id}
              onSuccess={() => {
                fetch(`/api/admin/users/${selectedUser.id}/admin-notes`)
                  .then((res) => res.json())
                  .then((data) => {
                    if (data.notes) {
                      setNotes(data.notes.map((n: { admin_id: string }) => ({
                        ...n,
                        user: selectedUser,
                      })))
                    }
                  })
              }}
            />
          </div>
        )}
      </Card>
      <div className="space-y-2">
        <input
          type="search"
          placeholder="Filter notes by user name, email, or content..."
          className="w-full px-3 py-2 border rounded-md text-sm"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>
      <div className="space-y-4">
        {filteredNotes.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">
              {selectedUser ? 'No notes for this user yet' : 'No admin notes yet'}
            </p>
          </Card>
        ) : (
          filteredNotes.map((note) => (
            <Card key={note.id} className="p-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
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
                    <span className="text-sm text-muted-foreground">•</span>
                    <p className="text-sm text-muted-foreground">
                      Note by {note.admin ? getFullName({ first_name: note.admin.first_name || '', last_name: note.admin.last_name || '' }) : 'Unknown'}
                    </p>
                  </div>
                  <p className="text-sm text-foreground mb-2">{note.note}</p>
                  <p className="text-xs text-muted-foreground">
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
