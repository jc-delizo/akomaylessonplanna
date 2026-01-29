import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getAuditLogData } from '@/lib/utils/admin-audit-log'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Download, Filter } from 'lucide-react'
import { getFullName } from '@/lib/utils/profile'

export default async function ActivityLogPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }> | { [key: string]: string | string[] | undefined }
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/support/activity')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const rawParams = searchParams instanceof Promise ? await searchParams : searchParams
  const params: Record<string, string> = {}
  Object.entries(rawParams).forEach(([key, value]) => {
    if (value) {
      params[key] = Array.isArray(value) ? value[0] : value
    }
  })

  const filterByAdminId = adminUser.admin_role !== 'super_admin' ? authUser.id : undefined
  const { logs, pagination } = await getAuditLogData(supabase, {
    admin_id: params.admin_id,
    action: params.action,
    entity_type: params.entity_type,
    startDate: params.startDate,
    endDate: params.endDate,
    page: params.page ? parseInt(params.page, 10) : undefined,
    limit: params.limit ? parseInt(params.limit, 10) : undefined,
  }, { filterByAdminId })

  const getActionColor = (action: string) => {
    if (action.includes('ban') || action.includes('delete') || action.includes('suspend')) {
      return 'bg-red-100 text-red-700'
    }
    if (action.includes('approve') || action.includes('verify')) {
      return 'bg-green-100 text-green-700'
    }
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Activity Log</h1>
          <p className="text-gray-600 mt-1">Comprehensive audit trail of all admin actions</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by action, reason, or target..."
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        </div>
      </Card>

      {/* Audit Log Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Timestamp</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Admin</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Action</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Target</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Reason</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">IP Address</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No audit log entries found
                  </td>
                </tr>
              ) : (
                logs?.map((log: any) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {log.admin ? getFullName(log.admin as any) : 'System'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={getActionColor(log.action)}>
                        {log.action.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="font-medium">{log.entity_type}</span>
                      <span className="text-gray-500 ml-1 font-mono text-xs">
                        #{log.entity_id.substring(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {log.reason || '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 font-mono">
                      {log.ip_address || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-4 py-3 border-t flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
              {pagination.total} entries
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={pagination.page === 1}>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled={pagination.page === pagination.totalPages}>
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
