import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getWithdrawalsData } from '@/lib/utils/admin-withdrawals'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DollarSign, Check, X, Clock } from 'lucide-react'
import { getFullName, getInitials } from '@/lib/utils/profile'

export default async function WithdrawalsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/financials/withdrawals')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser || adminUser.admin_role !== 'super_admin') {
    redirect('/admin')
  }

  const { withdrawals } = await getWithdrawalsData(createAdminClient(), { status: 'pending' })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-700">Processing</Badge>
      case 'completed':
        return <Badge className="bg-green-100 text-green-700">Completed</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-700">Failed</Badge>
      case 'rejected':
        return <Badge className="bg-gray-100 text-gray-700">Rejected</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Withdrawal Requests</h1>
        <p className="text-gray-600 mt-1">Process seller payouts manually</p>
      </div>

      <Card>
        <div className="overflow-x-auto -mx-4 md:mx-0">
          <table className="w-full min-w-[1000px]">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Request ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Seller</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payment Method</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Payment Number</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Requested</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {withdrawals?.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                    No pending withdrawals
                  </td>
                </tr>
              ) : (
                withdrawals?.map((withdrawal: any) => {
                  const seller = withdrawal.seller
                  return (
                    <tr key={withdrawal.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">
                        {withdrawal.id.substring(0, 8)}...
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {seller?.avatar_url ? (
                              <img
                                src={seller.avatar_url}
                                alt={seller ? getFullName(seller) : 'Seller'}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <span className="text-xs">{seller ? getInitials(seller.first_name || '', seller.last_name || '') : ''}</span>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{seller ? getFullName(seller) : 'N/A'}</p>
                            <p className="text-xs text-gray-500">{seller?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {formatCurrency(Number(withdrawal.amount))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">
                          {withdrawal.payment_method}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm font-mono">
                        {withdrawal.payment_number}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {new Date(withdrawal.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(withdrawal.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {withdrawal.status === 'pending' && (
                            <>
                              <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                <Check className="h-4 w-4 mr-1" />
                                Process
                              </Button>
                              <Button variant="outline" size="sm" className="border-red-300 text-red-600">
                                <X className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                          {withdrawal.status === 'processing' && (
                            <Button variant="outline" size="sm">
                              <Clock className="h-4 w-4 mr-1" />
                              View Status
                            </Button>
                          )}
                          {withdrawal.status === 'failed' && (
                            <Button variant="outline" size="sm">
                              Retry
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
