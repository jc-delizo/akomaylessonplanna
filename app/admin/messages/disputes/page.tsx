'use client'

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils/date'
import { AlertTriangle, CheckCircle, X } from 'lucide-react'
import Link from 'next/link'

interface Report {
  id: string
  report_type: string
  description?: string
  status: string
  created_at: string
  reporter: {
    id: string
    name: string
    username: string
  }
  reported_user: {
    id: string
    name: string
    username: string
  }
  conversation?: {
    id: string
  }
  message?: {
    id: string
    content: string
  }
}

export default function AdminDisputesPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/messages/reports?status=pending')
      if (!response.ok) throw new Error('Failed to fetch reports')
      const data = await response.json()
      setReports(data.reports || [])
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async (reportId: string, status: 'resolved' | 'dismissed') => {
    try {
      const response = await fetch(`/api/admin/messages/reports/${reportId}/resolve`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          resolution: status === 'resolved' ? 'Issue resolved' : 'Report dismissed',
        }),
      })
      if (response.ok) {
        setReports((prev) => prev.filter((r) => r.id !== reportId))
      }
    } catch (error) {
      console.error('Error resolving report:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-sm text-muted-foreground">Loading disputes...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Message Disputes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review and resolve user reports
        </p>
      </div>

      {reports.length === 0 ? (
        <Card className="p-8 text-center">
          <CheckCircle className="size-12 text-green-500 mx-auto mb-4" />
          <p className="text-lg font-medium">No pending disputes</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <Card key={report.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="size-4 text-yellow-500" />
                    <Badge variant="destructive">{report.report_type}</Badge>
                    <Badge variant="outline">{report.status}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatRelativeTime(new Date(report.created_at))}
                    </span>
                  </div>
                  {report.description && (
                    <p className="text-sm bg-muted p-3 rounded mb-4">
                      {report.description}
                    </p>
                  )}
                  {report.message && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground mb-1">Reported Message:</p>
                      <p className="text-sm bg-red-50 p-2 rounded border border-red-200">
                        {report.message.content}
                      </p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Reporter:</span>
                      <p className="font-medium">{report.reporter.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reported User:</span>
                      <p className="font-medium">{report.reported_user.name}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t">
                {report.conversation && (
                  <Link href={`/admin/messages/conversations/${report.conversation.id}`}>
                    <Button variant="outline" size="sm">
                      View Conversation
                    </Button>
                  </Link>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve(report.id, 'dismissed')}
                >
                  <X className="size-4 mr-2" />
                  Dismiss
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleResolve(report.id, 'resolved')}
                >
                  <CheckCircle className="size-4 mr-2" />
                  Resolve
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
