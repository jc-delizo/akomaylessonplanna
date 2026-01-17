import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, User, Package, MessageSquare } from 'lucide-react'
import { headers } from 'next/headers'

async function getUserReports() {
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:9',message:'getUserReports entry',data:{hasEnvVar:!!process.env.NEXT_PUBLIC_APP_URL},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie')
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:13',message:'Headers retrieved',data:{hasCookieHeader:!!cookieHeader},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const fetchUrl = `${baseUrl}/api/admin/reports?status=pending`
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:16',message:'Before fetch',data:{baseUrl,fetchUrl,hasCookieHeader:!!cookieHeader},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  const response = await fetch(fetchUrl, {
    cache: 'no-store',
    headers: cookieHeader ? { cookie: cookieHeader } : undefined,
  })
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:17',message:'After fetch',data:{status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  if (!response.ok) {
    // #region agent log
    const errorText = await response.text().catch(() => 'Failed to read error body');
    fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:21',message:'Response not ok',data:{status:response.status,statusText:response.statusText,errorBody:errorText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
    // #endregion
    throw new Error('Failed to fetch reports')
  }
  const result = await response.json()
  // #region agent log
  fetch('http://127.0.0.1:7248/ingest/00d5f2ca-d0b7-44d8-a520-af7d4c8e25e2',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'page.tsx:27',message:'getUserReports success',data:{reportsCount:result?.reports?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  // #endregion
  return result
}

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

  const { reports } = await getUserReports()

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
                      Reported by: {report.reporter?.name || 'Unknown'} •{' '}
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

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Dismiss
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Warn User
                </Button>
                <Button variant="outline" size="sm" className="flex-1 border-red-300 text-red-600">
                  Suspend/Ban
                </Button>
                <Button variant="outline" size="sm">
                  Contact Reporter
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
