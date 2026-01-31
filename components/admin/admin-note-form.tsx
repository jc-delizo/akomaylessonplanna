'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'

interface AdminNoteFormProps {
  userId: string
  onSuccess?: () => void
}

export function AdminNoteForm({ userId, onSuccess }: AdminNoteFormProps) {
  const router = useRouter()
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!note.trim() || note.length > 500) {
      setError('Note must be between 1 and 500 characters')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/users/${userId}/admin-notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add note')
      }
      setNote('')
      onSuccess?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add note')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
          {error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="admin-note">Add Note</Label>
        <Textarea
          id="admin-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Internal note about this user (max 500 chars)"
          rows={3}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">{note.length}/500</p>
      </div>
      <Button type="submit" size="sm" disabled={!note.trim() || loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Adding...
          </>
        ) : (
          'Add Note'
        )}
      </Button>
    </form>
  )
}
