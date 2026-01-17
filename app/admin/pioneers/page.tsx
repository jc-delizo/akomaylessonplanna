import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getAdminUser } from '@/lib/utils/admin-auth'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Award, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { headers } from 'next/headers'

async function getPioneers() {
  const headersList = await headers()
  const cookieHeader = headersList.get('cookie')
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const apiUrl = `${baseUrl}/api/admin/pioneers`
  
  const response = await fetch(apiUrl, {
    cache: 'no-store',
    headers: {
      ...(cookieHeader && { cookie: cookieHeader }),
    },
  })
  
  if (!response.ok) {
    let errorBody: any = null
    try {
      errorBody = await response.clone().json()
    } catch {
      errorBody = await response.clone().text()
    }
    throw new Error(`Failed to fetch pioneers: ${response.status} ${response.statusText} - ${JSON.stringify(errorBody)}`)
  }
  
  return response.json()
}

export default async function PioneersPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login?redirect=/admin/pioneers')
  }

  const adminUser = await getAdminUser(authUser.id)
  if (!adminUser) {
    redirect('/')
  }

  const { pioneers, total, maxSlots, availableSlots } = await getPioneers()

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pioneer Management</h1>
          <p className="text-gray-600 mt-1">
            Manage exclusive Pioneer sellers ({total}/{maxSlots} slots used)
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/pioneers/candidates">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              View Candidates
            </Button>
          </Link>
          {availableSlots > 0 && (
            <Link href="/admin/pioneers/add">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Pioneer
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Slot Counter */}
      <Card className="p-4 bg-purple-50 border-purple-200">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Available Pioneer Slots</p>
            <p className="text-2xl font-bold text-purple-700">
              {availableSlots} / {maxSlots}
            </p>
          </div>
          {availableSlots === 0 && (
            <Badge className="bg-red-100 text-red-700">Full</Badge>
          )}
        </div>
      </Card>

      {/* Pioneer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pioneers?.length === 0 ? (
          <Card className="p-8 text-center col-span-3">
            <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No Pioneers yet</p>
            <Link href="/admin/pioneers/candidates">
              <Button className="mt-4">View Candidates</Button>
            </Link>
          </Card>
        ) : (
          pioneers?.map((pioneer: any) => (
            <Card key={pioneer.id} className="p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  {pioneer.avatar_url ? (
                    <img
                      src={pioneer.avatar_url}
                      alt={pioneer.name}
                      className="w-16 h-16 rounded-full"
                    />
                  ) : (
                    <span className="text-lg font-medium">
                      {pioneer.name?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold truncate">{pioneer.name}</h3>
                    <Badge className="bg-purple-100 text-purple-700">
                      <Award className="h-3 w-3 mr-1" />
                      Pioneer
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{pioneer.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Since {new Date(pioneer.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Metrics */}
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Products:</span>
                  <span className="font-medium">{pioneer.metrics.productCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sales:</span>
                  <span className="font-medium">{pioneer.metrics.salesCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Revenue (30d):</span>
                  <span className="font-medium">
                    {formatCurrency(pioneer.metrics.revenue)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Commission Saved:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(pioneer.metrics.commissionSaved)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Rating:</span>
                  <span className="font-medium">
                    {pioneer.metrics.avgRating.toFixed(1)} ⭐
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Commission Rate:</span>
                  <span className="font-medium">
                    {pioneer.custom_commission_rate || 15}%
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Profile
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Analytics
                </Button>
                <Button variant="outline" size="sm" className="text-red-600 border-red-300">
                  Remove
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
