'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type ResolutionType =
  | 'dismissed'
  | 'user_banned'
  | 'user_warned'
  | 'product_suspended'
  | 'review_deleted'

interface Report {
  id: string
  report_type: string
  reported_item_id: string
  reportedItem?: { id?: string; seller_id?: string; sender_id?: string }
}

interface ReportResolveDialogProps {
  report: Report
  action: ResolutionType
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function ReportResolveDialog({
  report,
  action,
  open,
  onOpenChange,
  onSuccess,
}: ReportResolveDialogProps) {
  const router = useRouter()
  const [resolution_notes, setResolutionNotes] = useState('')
  const [ban_reviewer, setBanReviewer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const actionLabels: Record<ResolutionType, string> = {
    dismissed: 'Dismiss Report',
    user_banned: 'Ban User',
    user_warned: 'Warn User',
    product_suspended: 'Suspend Product',
    review_deleted: 'Delete Review',
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!resolution_notes.trim()) {
      setError('Resolution notes are required')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        resolution_type: action,
        resolution_notes: resolution_notes.trim(),
        reason: resolution_notes.trim(),
      }
      if (action === 'user_banned' || action === 'user_warned') {
        body.user_id =
          report.report_type === 'user'
            ? report.reported_item_id
            : report.report_type === 'message'
              ? report.reportedItem?.sender_id
              : report.reportedItem?.seller_id || report.reported_item_id
      }
      if (action === 'product_suspended') {
        body.product_id = report.report_type === 'product' ? report.reported_item_id : report.reportedItem?.id
      }
      if (action === 'review_deleted') {
        body.review_id = report.reported_item_id
        body.ban_reviewer = ban_reviewer
      }
      const response = await fetch(`/api/admin/reports/${report.id}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve report')
      }
      onOpenChange(false)
      setResolutionNotes('')
      setBanReviewer(false)
      onSuccess?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resolve report')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{actionLabels[action]}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="resolution_notes">Resolution Notes *</Label>
            <Textarea
              id="resolution_notes"
              value={resolution_notes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe the resolution and reason..."
              rows={4}
              required
            />
          </div>
          {action === 'review_deleted' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ban_reviewer"
                checked={ban_reviewer}
                onCheckedChange={(checked) => setBanReviewer(checked === true)}
              />
              <Label htmlFor="ban_reviewer" className="font-normal cursor-pointer">
                Ban reviewer (repeat offender)
              </Label>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!resolution_notes.trim() || loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                'Confirm'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
