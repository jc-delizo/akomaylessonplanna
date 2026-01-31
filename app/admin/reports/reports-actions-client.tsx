'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ReportResolveDialog } from '@/components/admin/report-resolve-dialog'

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
  reportedItem?: { id?: string; seller_id?: string }
}

interface ReportsActionsClientProps {
  report: Report
}

export function ReportsActionsClient({ report }: ReportsActionsClientProps) {
  const [resolveAction, setResolveAction] = useState<ResolutionType | null>(null)

  const getActions = (): { action: ResolutionType; label: string; variant?: 'destructive' }[] => {
    switch (report.report_type) {
      case 'user':
        return [
          { action: 'dismissed', label: 'Dismiss' },
          { action: 'user_warned', label: 'Warn User' },
          { action: 'user_banned', label: 'Ban User', variant: 'destructive' },
        ]
      case 'product':
        return [
          { action: 'dismissed', label: 'Dismiss' },
          { action: 'product_suspended', label: 'Suspend Product' },
          { action: 'user_banned', label: 'Ban Seller', variant: 'destructive' },
        ]
      case 'review':
        return [
          { action: 'dismissed', label: 'Dismiss' },
          { action: 'review_deleted', label: 'Delete Review' },
        ]
      case 'message':
        return [
          { action: 'dismissed', label: 'Dismiss' },
          { action: 'user_banned', label: 'Ban User', variant: 'destructive' },
        ]
      default:
        return [{ action: 'dismissed', label: 'Dismiss' }]
    }
  }

  const actions = getActions()

  return (
    <div className="flex flex-wrap gap-2">
      {actions.map(({ action, label, variant }) => (
        <Button
          key={action}
          variant="outline"
          size="sm"
          className={variant === 'destructive' ? 'border-red-300 text-red-600' : ''}
          onClick={() => setResolveAction(action)}
        >
          {label}
        </Button>
      ))}
      {resolveAction && (
        <ReportResolveDialog
          report={report}
          action={resolveAction}
          open={!!resolveAction}
          onOpenChange={(open) => !open && setResolveAction(null)}
        />
      )}
    </div>
  )
}
