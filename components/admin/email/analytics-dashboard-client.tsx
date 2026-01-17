'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Mail,
  CheckCircle2,
  Eye,
  MousePointerClick,
  XCircle,
  Clock,
  TrendingUp,
} from 'lucide-react'

interface EmailMetrics {
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  failed: number
  delivery_rate: number
  open_rate: number
  click_rate: number
  bounce_rate: number
}

interface QueueStatus {
  pending: number
  processing: number
}

interface TypeStats {
  email_type: string
  sent: number
  delivered: number
  opened: number
  clicked: number
  bounced: number
  delivery_rate: number
  open_rate: number
  click_rate: number
  bounce_rate: number
}

interface EmailAnalyticsClientProps {
  initialMetrics: EmailMetrics
  initialQueue: QueueStatus
  initialByType: TypeStats[]
  dateRange: { start_date: string; end_date: string }
}

export function EmailAnalyticsClient({
  initialMetrics,
  initialQueue,
  initialByType,
  dateRange,
}: EmailAnalyticsClientProps) {
  const [startDate, setStartDate] = useState(dateRange.start_date)
  const [endDate, setEndDate] = useState(dateRange.end_date)
  const [loading, setLoading] = useState(false)

  const handleDateChange = () => {
    const params = new URLSearchParams()
    if (startDate) params.set('start_date', startDate)
    if (endDate) params.set('end_date', endDate)
    window.location.href = `/admin/analytics/email?${params.toString()}`
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <div>
            <Label htmlFor="start_date">Start Date</Label>
            <Input
              id="start_date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="end_date">End Date</Label>
            <Input
              id="end_date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1"
            />
          </div>
          <Button onClick={handleDateChange} className="mt-6">
            Update
          </Button>
        </div>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Emails Sent</p>
              <p className="text-2xl font-bold mt-1">{initialMetrics.sent.toLocaleString()}</p>
            </div>
            <Mail className="h-8 w-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Delivery Rate</p>
              <p className="text-2xl font-bold mt-1">{initialMetrics.delivery_rate.toFixed(1)}%</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Open Rate</p>
              <p className="text-2xl font-bold mt-1">{initialMetrics.open_rate.toFixed(1)}%</p>
            </div>
            <Eye className="h-8 w-8 text-purple-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Bounce Rate</p>
              <p className="text-2xl font-bold mt-1">{initialMetrics.bounce_rate.toFixed(1)}%</p>
            </div>
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Queue Status */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Queue Status</h2>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-yellow-500" />
            <span className="text-sm text-gray-600">Pending:</span>
            <Badge variant="outline">{initialQueue.pending}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-500" />
            <span className="text-sm text-gray-600">Processing:</span>
            <Badge variant="outline">{initialQueue.processing}</Badge>
          </div>
        </div>
      </Card>

      {/* Performance by Type */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Performance by Email Type</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Email Type</th>
                <th className="text-right p-2">Sent</th>
                <th className="text-right p-2">Delivered</th>
                <th className="text-right p-2">Opened</th>
                <th className="text-right p-2">Clicked</th>
                <th className="text-right p-2">Open Rate</th>
                <th className="text-right p-2">Click Rate</th>
                <th className="text-right p-2">Bounce</th>
              </tr>
            </thead>
            <tbody>
              {initialByType.map((stat) => (
                <tr key={stat.email_type} className="border-b">
                  <td className="p-2 font-medium">{stat.email_type}</td>
                  <td className="p-2 text-right">{stat.sent}</td>
                  <td className="p-2 text-right">{stat.delivered}</td>
                  <td className="p-2 text-right">{stat.opened}</td>
                  <td className="p-2 text-right">{stat.clicked}</td>
                  <td className="p-2 text-right">{stat.open_rate.toFixed(1)}%</td>
                  <td className="p-2 text-right">{stat.click_rate.toFixed(1)}%</td>
                  <td className="p-2 text-right">
                    <Badge variant={stat.bounce_rate > 5 ? 'destructive' : 'outline'}>
                      {stat.bounce_rate.toFixed(1)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
