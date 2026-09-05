import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { getDisputesData } from '@/lib/utils/admin-disputes'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Scale, AlertTriangle, Clock } from 'lucide-react'

export default async function DisputesPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/support/disputes')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const { disputes } = await getDisputesData(createAdminClient(), { status: 'open' })

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge className="bg-red-100 text-red-700">High</Badge>
      case 'medium':
        return <Badge className="bg-orange-100 text-orange-700">Medium</Badge>
      case 'low':
        return <Badge className="bg-yellow-100 text-yellow-700">Low</Badge>
      default:
        return <Badge variant="outline">{severity}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    const typeColors: Record<string, string> = {
      quality: 'bg-blue-100 text-blue-700',
      payment: 'bg-green-100 text-green-700',
      copyright: 'bg-purple-100 text-purple-700',
      harassment: 'bg-red-100 text-red-700',
    }
    return (
      <Badge className={typeColors[type] || 'bg-gray-100 text-gray-700'}>{type}</Badge>
    )
  }

  const getDaysOpen = (createdAt: string) => {
    const days = Math.floor(
      (new Date().getTime() - new Date(createdAt).getTime()) / 86400000
    )
    return days
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dispute Resolution</h1>
        <p className="text-gray-600 mt-1">Mediate disputes between buyers and sellers (7-day max timeline)</p>
      </div>

      <div className="space-y-4">
        {disputes?.length === 0 ? (
          <Card className="p-8 text-center">
            <Scale className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No open disputes</p>
          </Card>
        ) : (
          disputes?.map((dispute: any) => {
            const daysOpen = getDaysOpen(dispute.created_at)
            const isOver7Days = daysOpen > 7

            return (
              <Card key={dispute.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {getTypeBadge(dispute.type)}
                      {getSeverityBadge(dispute.severity)}
                      {isOver7Days && (
                        <Badge className="bg-red-100 text-red-700">
                          Over 7 days
                        </Badge>
                      )}
                      {!isOver7Days && daysOpen >= 5 && (
                        <Badge className="bg-orange-100 text-orange-700">
                          {daysOpen} days open
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-semibold text-lg mb-1">
                      Dispute #{dispute.id.substring(0, 8)}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                      {dispute.description}
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Buyer: {dispute.buyer 
                          ? (dispute.buyer.first_name && dispute.buyer.last_name
                            ? `${dispute.buyer.first_name} ${dispute.buyer.last_name}`.trim()
                            : dispute.buyer.first_name || 'Unknown')
                          : 'Unknown'}</p>
                        <p className="text-gray-600">Seller: {dispute.seller 
                          ? (dispute.seller.first_name && dispute.seller.last_name
                            ? `${dispute.seller.first_name} ${dispute.seller.last_name}`.trim()
                            : dispute.seller.first_name || 'Unknown')
                          : 'Unknown'}</p>
                      </div>
                      <div>
                        {dispute.product && (
                          <p className="text-gray-600">
                            Product: {dispute.product.title}
                          </p>
                        )}
                        <p className="text-gray-600">
                          Opened: {new Date(dispute.created_at).toLocaleDateString()} ({daysOpen} days ago)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    Propose Resolution
                  </Button>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Final Decision
                  </Button>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
