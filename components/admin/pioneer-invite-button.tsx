'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Award } from 'lucide-react'
import { toast } from 'sonner'

interface PioneerInviteButtonProps {
  userId: string
  fullName: string
  disabled?: boolean
}

export function PioneerInviteButton({
  userId,
  fullName,
  disabled = false,
}: PioneerInviteButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleInvite() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/pioneers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to add Pioneer')
        setLoading(false)
        return
      }
      toast.success(`${fullName} is now a Pioneer`)
      setOpen(false)
      router.refresh()
    } catch {
      toast.error('Failed to add Pioneer')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          size="sm"
          className="bg-purple-600 hover:bg-purple-700"
          disabled={disabled}
        >
          <Award className="h-4 w-4 mr-2" />
          Invite
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add as Pioneer?</AlertDialogTitle>
          <AlertDialogDescription>
            Add {fullName} as a Pioneer Seller? They will get 15% commission
            (instead of 20%) and Pro features at no extra cost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleInvite()
            }}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {loading ? 'Adding…' : 'Add as Pioneer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
