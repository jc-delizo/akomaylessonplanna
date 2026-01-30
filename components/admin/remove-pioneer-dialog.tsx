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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'

const REMOVAL_REASONS = [
  'Inactive (60+ days)',
  'Quality issues',
  'Terms violation',
  'Requested by seller',
  'Other',
] as const

interface RemovePioneerDialogProps {
  pioneerId: string
  fullName: string
  isSuperAdmin: boolean
}

export function RemovePioneerDialog({
  pioneerId,
  fullName,
  isSuperAdmin,
}: RemovePioneerDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState<string>('')

  async function handleRemove() {
    if (!reason.trim()) {
      toast.error('Please select a reason for removal')
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/pioneers/${pioneerId}/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data.error ?? 'Failed to remove Pioneer')
        setLoading(false)
        return
      }
      toast.success('Pioneer status removed')
      setOpen(false)
      setReason('')
      router.refresh()
    } catch {
      toast.error('Failed to remove Pioneer')
    } finally {
      setLoading(false)
    }
  }

  if (!isSuperAdmin) return null

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
          Remove
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Pioneer status?</AlertDialogTitle>
          <AlertDialogDescription>
            Remove {fullName} from the Pioneer program? Their commission will revert to 20% and
            the Pioneer badge will be removed from their profile. They will receive an email
            notification.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-4">
          <Label htmlFor="reason">Reason for removal (required)</Label>
          <Select value={reason} onValueChange={setReason}>
            <SelectTrigger id="reason" className="mt-2">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {REMOVAL_REASONS.map((r) => (
                <SelectItem key={r} value={r}>
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleRemove()
            }}
            disabled={loading || !reason.trim()}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Removing…' : 'Remove Pioneer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
