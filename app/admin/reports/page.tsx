import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getReportsData } from '@/lib/utils/admin-reports'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, User, Package, MessageSquare } from 'lucide-react'
import { getFullName } from '@/lib/utils/profile'
import { ReportsActionsClient } from './reports-actions-client'

export default async function UserReportsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/reports')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const { reports } = await getReportsData(createAdminClient(), { status: 'pending' })

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <Package className="h-4 w-4" />
      case 'user':
        return <User className="h-4 w-4" />
      case 'review':
        return <MessageSquare className="h-4 w-4" />
      default:
        return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-700'
      case 'medium':
        return 'bg-orange-100 text-orange-700'
      case 'low':
        return 'bg-yellow-100 text-yellow-700'
      default:
        return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">User Reports</h1>
        <p className="text-gray-600 mt-1">Review and resolve user-submitted reports</p>
      </div>

      <div className="space-y-4">
        {reports?.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-500">No pending reports</p>
          </Card>
        ) : (
          reports?.map((report: any) => (
            <Card key={report.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getTypeIcon(report.report_type)}
                    <Badge variant="outline" className="capitalize">
                      {report.report_type}
                    </Badge>
                    <Badge className={getSeverityColor(report.severity)}>
                      {report.severity} priority
                    </Badge>
                    {report.escalation_level >= 3 && (
                      <Badge className="bg-red-100 text-red-700">
                        High Priority (3+ reports)
                      </Badge>
                    )}
                  </div>
                  <h3 className="font-semibold mb-1">{report.reason}</h3>
                  {report.description && (
                    <p className="text-sm text-gray-600 mb-2">{report.description}</p>
                  )}
                  <div className="text-sm text-gray-500">
                    <p>
                      Reported by: {report.reporter ? getFullName(report.reporter) : 'Unknown'} •{' '}
                      {new Date(report.created_at).toLocaleString()}
                    </p>
                    {report.reportedItem && (
                      <p className="mt-1">
                        Reported item: {report.reportedItem.title || report.reportedItem.name || 'N/A'}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <ReportsActionsClient report={report} />
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
